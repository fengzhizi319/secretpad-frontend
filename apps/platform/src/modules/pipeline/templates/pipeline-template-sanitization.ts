import templateImg from '@/assets/template.jpg';
import { Model } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from '../pipeline-protocol';
import { PipelineTemplateType } from '../pipeline-protocol';

export class TemplateSanitization
  extends Model
  implements PipelineTemplateContribution
{
  type: PipelineTemplateType = PipelineTemplateType.SANITIZATION;
  name = `数据脱敏测试`;
  argsFilled = false;
  description = '单节点数据脱敏测试模板';
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
            attrPaths: ['rules_json'],
            attrs: [
              {
                s: JSON.stringify(['mask_id_card', 'mask_mobile', 'mask_name']),
                is_na: false,
              },
            ],
            domain: `privacy`,
            name: `sanitization`,
            version: `1.1.0`,
          },
          inputs: [`${graphId}-node-1-output-0`],
          codeName: `privacy/sanitization`,
          x: -260,
          y: -80,
          label: `数据脱敏`,
          graphNodeId: `${graphId}-node-2`,
          status: `STAGING`,
        },
      ],
    };
  };
}
