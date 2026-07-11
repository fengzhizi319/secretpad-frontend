import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

import { ReactComponent as Blank } from '@/assets/template_type_blank.svg';
import { ReactComponent as Psi } from '@/assets/template_type_psi.svg';

export enum PipelineTemplateType {
  BLANK = 'blank',
  RISK = 'risk', // 二分类建模
  PSI = 'psi', // 联合圈人
  PSI_TEE = 'psi-tee', // 联合圈人
  PSI_TEE_GUIDE = 'psi-tee-guide',
  RISK_GUIDE = 'risk-guide', // 二分类建模
  PSI_GUIDE = 'psi-guide',
  TEE = 'TEE', // Tee
  TEE_GUIDE = 'tee-guide', // Tee guide
  DIFFERENTIAL_PRIVACY = 'differential-privacy', // 差分隐私
  DIFFERENTIAL_PRIVACY_GUIDE = 'differential-privacy-guide', // 差分隐私引导
  DATA_CLASSIFICATION = 'data-classification', // 数据分类分级
}

export type Pipeline = {
  projectId?: string | string[] | null;
  id?: string; // maybe should delete
  graphId?: string;
  name: string;
  templateType?: PipelineTemplateType;
};

export type PipelineTreeItem = {
  key: string;
  title: string;
};

export interface PipelineTemplateContribution {
  type: PipelineTemplateType;
  name: string;
  argsFilled: boolean;
  description?: string;
  minimap?: string;
  content: (graphId: string, options?: any) => { edges: any[]; nodes: any[] };
  computeMode?: string[];
}

export const PipelineCommands = {
  COPY: {
    id: 'pipeline.copy',
    label: '复制',
    icon: <CopyOutlined />,
  },
  DELETE: {
    id: 'pipeline.delete',
    label: '删除',
    icon: <DeleteOutlined />,
  },

  RENAME: {
    id: 'pipeline.rename',
    label: '重命名',
    icon: <EditOutlined />,
  },

  CREATE: {
    id: 'pipeline.create',
    label: '创建',
  },
};

export const TemplateIcon = {
  [PipelineTemplateType.BLANK]: Blank,
  [PipelineTemplateType.RISK]: Psi,
  [PipelineTemplateType.PSI]: Psi,
  [PipelineTemplateType.PSI_TEE]: Psi,
  [PipelineTemplateType.PSI_TEE_GUIDE]: Psi,
  [PipelineTemplateType.RISK_GUIDE]: Psi,
  [PipelineTemplateType.PSI_GUIDE]: Psi,
  [PipelineTemplateType.TEE]: Blank,
  [PipelineTemplateType.TEE_GUIDE]: Blank,
  [PipelineTemplateType.DIFFERENTIAL_PRIVACY]: SafetyOutlined,
  [PipelineTemplateType.DIFFERENTIAL_PRIVACY_GUIDE]: SafetyOutlined,
  [PipelineTemplateType.DATA_CLASSIFICATION]: SafetyOutlined,
};
