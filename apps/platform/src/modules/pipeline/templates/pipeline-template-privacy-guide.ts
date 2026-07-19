import templateImg from '@/assets/template.jpg';
import { Model } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from '../pipeline-protocol';
import { PipelineTemplateType } from '../pipeline-protocol';

export class TemplateGuidePrivacy
  extends Model
  implements PipelineTemplateContribution
{
  type: PipelineTemplateType = PipelineTemplateType.DIFFERENTIAL_PRIVACY_GUIDE;
  name = `差分隐私测试`;
  argsFilled = true;
  description = '单节点差分隐私查询引导模板';
  computeMode = ['MPC', 'TEE'];

  minimap = templateImg;

  content = (graphId: string) => {
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
            attrPaths: ['datatable_selected'],
            attrs: [
              {
                s: 'alice-table',
                is_na: false,
              },
            ],
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
          outputs: [`${graphId}-node-2-output-0`],
          nodeDef: {
            attrPaths: [
              'query_type',
              'query_col',
              'epsilon_total',
              'delta',
              'epsilon_per_query',
              'delta_per_query',
              'mechanism',
              'column_sensitivities_json',
              'bins_json',
              'true_count',
              'true_sum',
              'true_counts_json',
              'sensitivity',
              'random_state',
            ],
            attrs: [
              {
                s: 'mean',
                is_na: false,
              },
              {
                s: 'age',
                is_na: false,
              },
              {
                f: 1.0,
                is_na: false,
              },
              {
                f: 0.0,
                is_na: false,
              },
              {
                f: 0.1,
                is_na: false,
              },
              {
                f: 0.0,
                is_na: false,
              },
              {
                s: 'laplace',
                is_na: false,
              },
              {
                s: JSON.stringify({ age: 1.0 }),
                is_na: false,
              },
              {
                s: '[]',
                is_na: false,
              },
              {
                f: 0.0,
                is_na: false,
              },
              {
                f: 0.0,
                is_na: false,
              },
              {
                s: '{}',
                is_na: false,
              },
              {
                f: 0.0,
                is_na: false,
              },
              {
                i64: 0,
                is_na: false,
              },
            ],
            domain: `privacy`,
            name: `differential_privacy`,
            version: `1.1.0`,
          },
          inputs: [`${graphId}-node-1-output-0`],
          codeName: `privacy/differential_privacy`,
          x: -260,
          y: -80,
          label: `差分隐私`,
          graphNodeId: `${graphId}-node-2`,
          status: `STAGING`,
        },
      ],
    };
  };
}
