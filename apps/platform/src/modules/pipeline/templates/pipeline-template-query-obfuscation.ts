import templateImg from '@/assets/template.jpg';
import { Model } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from '../pipeline-protocol';
import { PipelineTemplateType } from '../pipeline-protocol';

export class TemplateQueryObfuscation
  extends Model
  implements PipelineTemplateContribution
{
  type: PipelineTemplateType = PipelineTemplateType.QUERY_OBFUSCATION;
  name = `查询混淆测试`;
  argsFilled = false;
  description = '单节点查询混淆测试模板';
  computeMode = ['MPC', 'TEE'];

  minimap = templateImg;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content = (graphId: string) => {
    return {
      edges: [],
      nodes: [
        {
          outputs: [`${graphId}-node-1-output-0`],
          nodeDef: {
            attrPaths: [
              'query',
              'synonym_map_json',
              'num_dummies',
              'domain',
              'medical_pool_json',
              'generic_pool_json',
              'random_state',
            ],
            attrs: [
              {
                s: '患者张三患有艾滋病，如何查询相关诊疗方案',
                is_na: false,
              },
              {
                s: '{}',
                is_na: false,
              },
              {
                i64: 3,
                is_na: false,
              },
              {
                s: 'medical',
                is_na: false,
              },
              {
                s: '[]',
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
            name: `query_obfuscation`,
            version: `1.1.0`,
          },
          inputs: [],
          codeName: `privacy/query_obfuscation`,
          x: -260,
          y: -210,
          label: `查询混淆`,
          graphNodeId: `${graphId}-node-1`,
          status: `STAGING`,
        },
      ],
    };
  };
}
