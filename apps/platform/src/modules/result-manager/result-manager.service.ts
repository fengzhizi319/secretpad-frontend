import { message } from 'antd';

import { listNode } from '@/services/secretpad/InstController';
import { getNodeResultDetail, listResults } from '@/services/secretpad/NodeController';
import { Model } from '@/util/valtio-helper';

import type { TableType } from './result-manager.protocol';

type TableTypeMapper = {
  [key in TableType]: string;
};

export const TableTypeMap: TableTypeMapper = {
  table: '表',
  report: '报告',
  rule: '规则',
  model: '模型',
};

export enum ResultTableState {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RUNNING = 'RUNNING',
}

export class ResultManagerService extends Model {
  list = [];

  loading = false;

  /** AUTONOMY 模式 - 机构下的所有可用节点 */
  autonomyNodeList: API.NodeVO[] = [];

  private triggerDownload = (blob: Blob, filename: string) => {
    const data = new Blob(['\ufeff', blob], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(data);
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  download = async (nodeId: string, tableInfo: API.NodeResultsVO) => {
    message.info('开始下载,请稍等...');
    const token = localStorage.getItem('User-Token') || '';
    fetch(`/api/v1alpha1/data/download`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'User-Token': token,
      },

      body: JSON.stringify({
        nodeId,
        domainDataId: tableInfo.domainDataId,
      }),
    }).then((res) =>
      res.blob().then((blob) => {
        const disposition = res.headers.get('Content-Disposition');
        let filename = '';
        const filenameRegex = /filename[^;=\n]*=[^'"]*['"]*((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition || '');
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
        this.triggerDownload(blob, filename);
        message.success('下载完成');
      }),
    );
  };

  downloadReport = async (nodeId: string, tableInfo: API.NodeResultsVO) => {
    message.info('开始下载报告,请稍等...');
    try {
      const { data } = await getNodeResultDetail({
        domainDataId: tableInfo.domainDataId as string,
        nodeId,
      });
      const report = (data as API.NodeResultDetailVO)?.output;
      if (!report?.tabs?.length) {
        message.warning('报告暂无数据');
        return;
      }
      const csv = reportToCsv(report.tabs as ReportTab[]);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `${tableInfo.domainDataId || 'report'}.csv`;
      this.triggerDownload(blob, filename);
      message.success('报告下载完成');
    } catch (e) {
      message.error((e as Error).message || '报告下载失败');
    }
  };

  async getResultList(
    ownerId: string,
    pageNumber: number,
    pageSize: number,
    search: string,
    types: string[],
    sortRule: string,
    nodeNamesFilter: string[] | null,
  ) {
    const result = await listResults({
      ownerId,
      pageNumber,
      pageSize,
      nameFilter: search,
      kindFilters: types,
      timeSortingRule: sortRule,
      nodeNamesFilter,
    });
    return result.data;
  }

  async getList() {
    this.loading = true;
    // const result = await listResults({});
    // this.list = result.data;
    this.loading = false;
  }

  /** AUTONOMY 模式下获取机构下所有可用节点列表 */
  getAutonomyNodeList = async () => {
    const { status, data } = await listNode();
    if (status && status.code === 0) {
      this.autonomyNodeList = data || [];
    } else {
      message.error(status?.msg);
    }
  };
}

type ReportValue = {
  s?: string;
  f?: number;
  i64?: string | number;
  b?: boolean;
};

type ReportTable = {
  headers: { name: string; type: string }[];
  rows: { name: string; items: ReportValue[] }[];
};

type ReportChild =
  | { type: 'table'; table: ReportTable }
  | {
      type: 'descriptions';
      descriptions: { items: { name: string; value: ReportValue }[] };
    }
  | { type: 'div'; div: { children: ReportChild[] } };

type ReportTab = {
  name?: string;
  divs: { children: ReportChild[] }[];
};

const valueToString = (value: ReportValue | undefined, type: string): string => {
  if (!value) return '';
  switch (type) {
    case 's':
    case 'AT_STRING':
      return value.s ?? '';
    case 'f':
    case 'AT_FLOAT':
      return value.f !== undefined ? String(value.f) : '';
    case 'i64':
    case 'AT_INT':
      return value.i64 !== undefined ? String(value.i64) : '';
    case 'b':
    case 'AT_BOOL':
      return value.b !== undefined ? String(value.b) : '';
    default:
      return value.s ?? String(value.f ?? value.i64 ?? value.b ?? '');
  }
};

const escapeCsv = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const appendTableToCsv = (table: ReportTable, lines: string[]) => {
  if (!table?.headers?.length) return;
  lines.push(table.headers.map((h) => escapeCsv(h.name)).join(','));
  table.rows.forEach((row) => {
    lines.push(
      row.items
        .map((item, index) =>
          escapeCsv(valueToString(item, table.headers[index]?.type || 's')),
        )
        .join(','),
    );
  });
};

const appendChildToCsv = (child: ReportChild, lines: string[]) => {
  if (child.type === 'table') {
    appendTableToCsv(child.table, lines);
  } else if (child.type === 'descriptions') {
    child.descriptions.items.forEach((item) => {
      lines.push(
        `${escapeCsv(item.name)},${escapeCsv(valueToString(item.value, 's'))}`,
      );
    });
  } else if (child.type === 'div') {
    child.div.children.forEach((c) => appendChildToCsv(c, lines));
  }
};

const reportToCsv = (tabs: ReportTab[]) => {
  const lines: string[] = [];
  tabs.forEach((tab, index) => {
    if (index > 0) lines.push('');
    if (tab.name) lines.push(escapeCsv(tab.name));
    tab.divs.forEach((div) => {
      div.children.forEach((child) => appendChildToCsv(child, lines));
    });
  });
  return lines.join('\n');
};
