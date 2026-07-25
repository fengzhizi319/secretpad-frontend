/**
 * 隐私组件 Pipeline 模板单元测试
 *
 * 参考 privacy-local-agent/console/web 前端测试模式，
 * 验证各隐私组件模板生成的 DAG 图结构是否正确。
 * 数据源对应 Kuscia 中的 alice_privacy.csv / bob_privacy.csv。
 */
import '@secretflow/testing/jest';

jest.mock('@/util/valtio-helper', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { proxy } = require('valtio');

  class Model {
    constructor() {
      return proxy(this);
    }
  }

  const modelMap = new WeakMap();

  return {
    Model,
    getModel: <T extends new () => InstanceType<T>>(ModelClass: T): InstanceType<T> => {
      if (!modelMap.has(ModelClass)) {
        modelMap.set(ModelClass, proxy(new ModelClass()));
      }
      return modelMap.get(ModelClass);
    },
    useModel: jest.fn(),
  };
});

// mock 图片资源
jest.mock('@/assets/template.jpg', () => 'template.jpg');

import { TemplatePrivacy } from './templates/pipeline-template-privacy';
import { TemplateKAnonymity } from './templates/pipeline-template-k-anonymity';
import { TemplateLDiversity } from './templates/pipeline-template-l-diversity';
import { TemplateSanitization } from './templates/pipeline-template-sanitization';
import { TemplateQueryObfuscation } from './templates/pipeline-template-query-obfuscation';
import { TemplateLocalDifferentialPrivacy } from './templates/pipeline-template-local-differential-privacy';
import { PipelineTemplateType } from './pipeline-protocol';

const GRAPH_ID = 'test-graph-001';

/** alice_privacy.csv 在 Kuscia 注册后的 datatableId */
const ALICE_PRIVACY_TABLE_ID = 'alice-privacy-table';

describe('差分隐私模板 (TemplatePrivacy)', () => {
  const tpl = new TemplatePrivacy();

  it('type 应为 differential-privacy', () => {
    expect(tpl.type).toBe(PipelineTemplateType.DIFFERENTIAL_PRIVACY);
  });

  it('无 quickConfigs 时生成 2 节点 1 边', () => {
    const graph = tpl.content(GRAPH_ID);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it('read_data 节点 codeName 正确', () => {
    const graph = tpl.content(GRAPH_ID);
    const readNode = graph.nodes.find((n: any) => n.codeName === 'read_data/datatable');
    expect(readNode).toBeDefined();
    expect(readNode.graphNodeId).toBe(`${GRAPH_ID}-node-1`);
  });

  it('privacy 节点 codeName 为 privacy/differential_privacy', () => {
    const graph = tpl.content(GRAPH_ID);
    const dpNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/differential_privacy',
    );
    expect(dpNode).toBeDefined();
    expect(dpNode.nodeDef.domain).toBe('privacy');
    expect(dpNode.nodeDef.name).toBe('differential_privacy');
  });

  it('传入 quickConfigs 时 datatable_selected 被填充', () => {
    const quickConfigs = { dataTable: { s: ALICE_PRIVACY_TABLE_ID } };
    const graph = tpl.content(GRAPH_ID, quickConfigs);
    const readNode = graph.nodes.find((n: any) => n.codeName === 'read_data/datatable');
    expect(readNode.nodeDef.attrPaths).toContain('datatable_selected');
    expect(readNode.nodeDef.attrs[0].s).toBe(ALICE_PRIVACY_TABLE_ID);
  });

  it('差分隐私默认参数包含 epsilon_total=10 和 mechanism=laplace', () => {
    const graph = tpl.content(GRAPH_ID);
    const dpNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/differential_privacy',
    );
    const { attrPaths, attrs } = dpNode.nodeDef;
    const epsIdx = attrPaths.indexOf('epsilon_total');
    const mechIdx = attrPaths.indexOf('mechanism');
    expect(attrs[epsIdx].f).toBe(10.0);
    expect(attrs[mechIdx].s).toBe('laplace');
  });
});

describe('K-匿名模板 (TemplateKAnonymity)', () => {
  const tpl = new TemplateKAnonymity();

  it('type 应为 k-anonymity', () => {
    expect(tpl.type).toBe(PipelineTemplateType.K_ANONYMITY);
  });

  it('生成 2 节点 1 边', () => {
    const graph = tpl.content(GRAPH_ID);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it('privacy 节点 codeName 为 privacy/k_anonymity', () => {
    const graph = tpl.content(GRAPH_ID);
    const kNode = graph.nodes.find((n: any) => n.codeName === 'privacy/k_anonymity');
    expect(kNode).toBeDefined();
    expect(kNode.nodeDef.domain).toBe('privacy');
  });

  it('传入 qiCols/saCols 时正确序列化到 attrs', () => {
    const quickConfigs = {
      dataTable: { s: ALICE_PRIVACY_TABLE_ID },
      qiCols: ['age', 'zipcode'],
      saCols: ['diagnosis'],
    };
    const graph = tpl.content(GRAPH_ID, quickConfigs);
    const kNode = graph.nodes.find((n: any) => n.codeName === 'privacy/k_anonymity');
    const { attrPaths, attrs } = kNode.nodeDef;
    const qiIdx = attrPaths.indexOf('qi_cols_json');
    const saIdx = attrPaths.indexOf('sa_cols_json');
    expect(JSON.parse(attrs[qiIdx].s)).toEqual(['age', 'zipcode']);
    expect(JSON.parse(attrs[saIdx].s)).toEqual(['diagnosis']);
  });

  it('默认 k=2', () => {
    const graph = tpl.content(GRAPH_ID);
    const kNode = graph.nodes.find((n: any) => n.codeName === 'privacy/k_anonymity');
    const { attrPaths, attrs } = kNode.nodeDef;
    const kIdx = attrPaths.indexOf('k');
    expect(attrs[kIdx].i64).toBe(2);
  });
});

describe('L-多样性模板 (TemplateLDiversity)', () => {
  const tpl = new TemplateLDiversity();

  it('type 应为 l-diversity', () => {
    expect(tpl.type).toBe(PipelineTemplateType.L_DIVERSITY);
  });

  it('privacy 节点 codeName 为 privacy/l_diversity', () => {
    const graph = tpl.content(GRAPH_ID);
    const lNode = graph.nodes.find((n: any) => n.codeName === 'privacy/l_diversity');
    expect(lNode).toBeDefined();
  });

  it('默认 k=2, l=2', () => {
    const graph = tpl.content(GRAPH_ID);
    const lNode = graph.nodes.find((n: any) => n.codeName === 'privacy/l_diversity');
    const { attrPaths, attrs } = lNode.nodeDef;
    const kIdx = attrPaths.indexOf('k');
    const lIdx = attrPaths.indexOf('l');
    expect(attrs[kIdx].i64).toBe(2);
    expect(attrs[lIdx].i64).toBe(2);
  });
});

describe('数据脱敏模板 (TemplateSanitization)', () => {
  const tpl = new TemplateSanitization();

  it('type 应为 sanitization', () => {
    expect(tpl.type).toBe(PipelineTemplateType.SANITIZATION);
  });

  it('privacy 节点 codeName 为 privacy/sanitization', () => {
    const graph = tpl.content(GRAPH_ID);
    const sNode = graph.nodes.find((n: any) => n.codeName === 'privacy/sanitization');
    expect(sNode).toBeDefined();
  });

  it('传入 sanitizationCols 时生成正确的 rules_json', () => {
    const quickConfigs = {
      dataTable: { s: ALICE_PRIVACY_TABLE_ID },
      sanitizationCols: ['name', 'id_card', 'mobile'],
    };
    const graph = tpl.content(GRAPH_ID, quickConfigs);
    const sNode = graph.nodes.find((n: any) => n.codeName === 'privacy/sanitization');
    const { attrPaths, attrs } = sNode.nodeDef;
    const rulesIdx = attrPaths.indexOf('rules_json');
    const rules = JSON.parse(attrs[rulesIdx].s);
    expect(rules).toHaveLength(3);
    expect(rules[0]).toEqual({ column: 'name', method: 'auto_mask' });
    expect(rules[1]).toEqual({ column: 'id_card', method: 'auto_mask' });
    expect(rules[2]).toEqual({ column: 'mobile', method: 'auto_mask' });
  });

  it('无 sanitizationCols 时 rules_json 为空数组', () => {
    const graph = tpl.content(GRAPH_ID);
    const sNode = graph.nodes.find((n: any) => n.codeName === 'privacy/sanitization');
    const { attrPaths, attrs } = sNode.nodeDef;
    const rulesIdx = attrPaths.indexOf('rules_json');
    expect(JSON.parse(attrs[rulesIdx].s)).toEqual([]);
  });
});

describe('查询混淆模板 (TemplateQueryObfuscation)', () => {
  const tpl = new TemplateQueryObfuscation();

  it('type 应为 query-obfuscation', () => {
    expect(tpl.type).toBe(PipelineTemplateType.QUERY_OBFUSCATION);
  });

  it('argsFilled 应为 true（无需输入表）', () => {
    expect(tpl.argsFilled).toBe(true);
  });

  it('生成 1 节点 0 边（无需读数据表）', () => {
    const graph = tpl.content(GRAPH_ID);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it('privacy 节点 codeName 为 privacy/query_obfuscation', () => {
    const graph = tpl.content(GRAPH_ID);
    const qNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/query_obfuscation',
    );
    expect(qNode).toBeDefined();
    expect(qNode.nodeDef.domain).toBe('privacy');
  });

  it('默认包含医疗领域批量查询', () => {
    const graph = tpl.content(GRAPH_ID);
    const qNode = graph.nodes[0];
    const { attrPaths, attrs } = qNode.nodeDef;
    const queriesIdx = attrPaths.indexOf('queries_json');
    const queries = JSON.parse(attrs[queriesIdx].s);
    expect(queries.length).toBeGreaterThanOrEqual(2);
    const domainIdx = attrPaths.indexOf('domain');
    expect(attrs[domainIdx].s).toBe('medical');
  });
});

describe('本地差分隐私模板 (TemplateLocalDifferentialPrivacy)', () => {
  const tpl = new TemplateLocalDifferentialPrivacy();

  it('type 应为 local-differential-privacy', () => {
    expect(tpl.type).toBe(PipelineTemplateType.LOCAL_DIFFERENTIAL_PRIVACY);
  });

  it('生成 2 节点 1 边', () => {
    const graph = tpl.content(GRAPH_ID);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it('privacy 节点 codeName 为 privacy/local_differential_privacy', () => {
    const graph = tpl.content(GRAPH_ID);
    const ldpNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/local_differential_privacy',
    );
    expect(ldpNode).toBeDefined();
  });

  it('传入 queryCol 时正确填充', () => {
    const quickConfigs = {
      dataTable: { s: ALICE_PRIVACY_TABLE_ID },
      queryCol: { s: 'has_disease' },
    };
    const graph = tpl.content(GRAPH_ID, quickConfigs);
    const ldpNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/local_differential_privacy',
    );
    const { attrPaths, attrs } = ldpNode.nodeDef;
    const colIdx = attrPaths.indexOf('query_col');
    expect(attrs[colIdx].s).toBe('has_disease');
    expect(attrs[colIdx].is_na).toBe(false);
  });

  it('默认 mechanism 为 binary_rr', () => {
    const graph = tpl.content(GRAPH_ID);
    const ldpNode = graph.nodes.find(
      (n: any) => n.codeName === 'privacy/local_differential_privacy',
    );
    const { attrPaths, attrs } = ldpNode.nodeDef;
    const mechIdx = attrPaths.indexOf('mechanism');
    expect(attrs[mechIdx].s).toBe('binary_rr');
  });
});

describe('所有隐私模板的通用结构验证', () => {
  const templates = [
    { name: 'TemplatePrivacy', cls: TemplatePrivacy },
    { name: 'TemplateKAnonymity', cls: TemplateKAnonymity },
    { name: 'TemplateLDiversity', cls: TemplateLDiversity },
    { name: 'TemplateSanitization', cls: TemplateSanitization },
    { name: 'TemplateQueryObfuscation', cls: TemplateQueryObfuscation },
    { name: 'TemplateLocalDifferentialPrivacy', cls: TemplateLocalDifferentialPrivacy },
  ];

  it.each(templates)('$name 的 computeMode 包含 MPC', ({ cls }) => {
    const tpl = new cls();
    expect(tpl.computeMode).toContain('MPC');
  });

  it.each(templates)('$name 的 content 返回合法 edges/nodes 数组', ({ cls }) => {
    const tpl = new cls();
    const graph = tpl.content(GRAPH_ID);
    expect(Array.isArray(graph.edges)).toBe(true);
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
  });

  it.each(templates)('$name 所有节点都有 graphNodeId 和 status', ({ cls }) => {
    const tpl = new cls();
    const graph = tpl.content(GRAPH_ID);
    graph.nodes.forEach((node: any) => {
      expect(node.graphNodeId).toBeDefined();
      expect(node.status).toBe('STAGING');
    });
  });

  it.each(templates)('$name 所有边引用的节点都存在', ({ cls }) => {
    const tpl = new cls();
    const graph = tpl.content(GRAPH_ID);
    const nodeIds = new Set(graph.nodes.map((n: any) => n.graphNodeId));
    graph.edges.forEach((edge: any) => {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    });
  });
});
