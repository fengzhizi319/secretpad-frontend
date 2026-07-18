import templateImg from '@/assets/template.jpg';
import { Model } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from '../pipeline-protocol';
import { PipelineTemplateType } from '../pipeline-protocol';

export class TemplateLocalDifferentialPrivacy
  extends Model
  implements PipelineTemplateContribution
{
  type: PipelineTemplateType = PipelineTemplateType.LOCAL_DIFFERENTIAL_PRIVACY;
  name = `本地差分隐私测试`;
  argsFilled = false;
  description = '单节点本地差分隐私测试模板';
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
              'op',
              'mechanism',
              'query_col',
              'epsilon',
              'categories_json',
              'random_state',
            ],
            attrs: [
              {
                s: 'perturb',
                is_na: false,
              },
              {
                s: 'binary_rr',
                is_na: false,
              },
              {
                s: 'has_disease',
                is_na: false,
              },
              {
                f: 1.0,
                is_na: false,
              },
              {
                s: '[]',
                is_na: false,
              },
              {
                i64: 42,
                is_na: false,
              },
            ],
            domain: `privacy`,
            name: `local_differential_privacy`,
            version: `1.0.0`,
          },
          inputs: [`${graphId}-node-1-output-0`],
          codeName: `privacy/local_differential_privacy`,
          x: -260,
          y: -80,
          label: `本地差分隐私`,
          graphNodeId: `${graphId}-node-2`,
          status: `STAGING`,
        },
      ],
    };
  };
}
