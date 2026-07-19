import templateImg from '@/assets/template.jpg';
import { Model } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from '../pipeline-protocol';
import { PipelineTemplateType } from '../pipeline-protocol';

export class TemplateKAnonymity extends Model implements PipelineTemplateContribution {
  type: PipelineTemplateType = PipelineTemplateType.K_ANONYMITY;
  name = `K-匿名测试`;
  argsFilled = false;
  description = '单节点K-匿名脱敏测试模板';
  computeMode = ['MPC', 'TEE'];

  minimap = templateImg;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content = (graphId: string, quickConfigs?: any) => {
    const { dataTable } = quickConfigs || {};

    const tableDef = dataTable
      ? {
          attrPaths: ['datatable_selected'],
          attrs: [{ ...dataTable, is_na: false }],
        }
      : {};

    return {
      edges: [
        {
          edgeId: `${graphId}-node-1-output-0__${graphId}-node-2-input-0`,
          sourceAnchor: `${graphId}-node-1-output-0`,
          targetAnchor: `${graphId}-node-2-input-0`,
          source: `${graphId}-node-1`,
          target: `${graphId}-node-2`,
        },
      ],
      nodes: [
        {
          outputs: [`${graphId}-node-1-output-0`],
          nodeDef: {
            ...tableDef,
            domain: `read_data`,
            name: `datatable`,
            version: `0.0.1`,
          },
          inputs: [],
          codeName: `read_data/datatable`,
          x: -260,
          y: -210,
          label: `样本表`,
          graphNodeId: `${graphId}-node-1`,
          status: `STAGING`,
        },
        {
          outputs: [`${graphId}-node-2-output-0`, `${graphId}-node-2-output-1`],
          nodeDef: {
            attrPaths: [
              'k',
              'qi_cols_json',
              'sa_cols_json',
              'suppression_rate',
              'report_result',
              'max_depth',
              'hierarchies_json',
            ],
            attrs: [
              {
                i64: 2,
                is_na: false,
              },
              {
                s: JSON.stringify(['age', 'zipcode']),
                is_na: false,
              },
              {
                s: JSON.stringify(['diagnosis']),
                is_na: false,
              },
              {
                f: 0.05,
                is_na: false,
              },
              {
                b: true,
                is_na: false,
              },
              {
                i64: 10,
                is_na: false,
              },
              {
                s: '{}',
                is_na: false,
              },
            ],
            domain: `privacy`,
            name: `k_anonymity`,
            version: `1.1.0`,
          },
          inputs: [`${graphId}-node-1-output-0`],
          codeName: `privacy/k_anonymity`,
          x: -260,
          y: -80,
          label: `K-匿名`,
          graphNodeId: `${graphId}-node-2`,
          status: `STAGING`,
        },
      ],
    };
  };
}
