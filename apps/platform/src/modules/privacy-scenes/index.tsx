import {
  ApartmentOutlined,
  BlockOutlined,
  MergeCellsOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, Card, Tag, message } from 'antd';
import React from 'react';

import { CreateProjectService } from '@/modules/create-project/create-project.service';
import { ComputeModeType } from '@/modules/p2p-project-list/components/common';
import { PipelineTemplateType } from '@/modules/pipeline/pipeline-protocol';
import { useModel } from '@/util/valtio-helper';

import styles from './index.less';

interface SceneItem {
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  icon: React.ReactNode;
  templateId: PipelineTemplateType;
  computeMode: ComputeModeType;
}

const scenes: SceneItem[] = [
  {
    title: '差分隐私统计',
    tag: 'DP',
    tagColor: 'blue',
    description:
      '在多方数据上添加 Laplace/Gaussian 噪声，实现 ε-差分隐私的聚合统计，保护个体记录不被反推。',
    icon: <SecurityScanOutlined />,
    templateId: PipelineTemplateType.DIFFERENTIAL_PRIVACY,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: 'K-匿名脱敏',
    tag: 'K-Anon',
    tagColor: 'orange',
    description:
      '对标识符与准标识符进行泛化与抑制，确保同一等价组内记录数 ≥ K，降低重识别风险。',
    icon: <MergeCellsOutlined />,
    templateId: PipelineTemplateType.BLANK,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: '分类分级识别',
    tag: 'Classification',
    tagColor: 'green',
    description:
      '自动识别数据表中的敏感字段，按机构/行业规范打标签（如 PII、机密、公开），生成数据分级报告。',
    icon: <SafetyOutlined />,
    templateId: PipelineTemplateType.DATA_CLASSIFICATION,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: '隐私求交（PSI）',
    tag: 'PSI',
    tagColor: 'blue',
    description:
      '多方在不泄露非交集数据的前提下，计算 ID 集合的交集，常用于黑名单共享、联合营销。',
    icon: <SwapOutlined />,
    templateId: PipelineTemplateType.PSI_SCENARIO,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: '安全聚合',
    tag: 'SecAgg',
    tagColor: 'blue',
    description:
      '联邦学习场景下对多方梯度/参数进行安全聚合，防止服务端看到单方原始梯度。',
    icon: <ApartmentOutlined />,
    templateId: PipelineTemplateType.BLANK,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: '安全分箱与 WOE',
    tag: 'Binning',
    tagColor: 'green',
    description: '多方联合计算特征分箱与证据权重（WOE），用于联邦风控评分卡建模。',
    icon: <BlockOutlined />,
    templateId: PipelineTemplateType.BLANK,
    computeMode: ComputeModeType.MPC,
  },
];

export const PrivacyScenesComponent: React.FC = () => {
  const createProjectService = useModel(CreateProjectService);
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleRun = async (scene: SceneItem) => {
    setLoading(scene.title);
    try {
      const quickConfigs =
        scene.templateId !== PipelineTemplateType.BLANK
          ? await createProjectService.buildScenarioQuickConfigs(scene.templateId)
          : undefined;

      await createProjectService.createProject(
        {
          projectName: `${scene.title} - ${new Date().toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          templateId: scene.templateId,
          description: scene.description,
          computeMode: scene.computeMode,
          nodes: ['alice', 'bob'],
        },
        true,
        quickConfigs,
      );
    } catch (e) {
      message.error((e as Error).message || '创建项目失败');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.privacyScenes}>
      <div className={styles.pageTitle}>隐私组件典型场景</div>
      <div className={styles.sceneGrid}>
        {scenes.map((scene) => (
          <Card
            key={scene.title}
            className={styles.sceneCard}
            bordered={false}
            hoverable
          >
            <div className={styles.sceneHeader}>
              <span className={styles.sceneIcon}>{scene.icon}</span>
              <span className={styles.sceneTitle}>{scene.title}</span>
              <Tag color={scene.tagColor}>{scene.tag}</Tag>
            </div>
            <div className={styles.sceneDesc}>{scene.description}</div>
            <div className={styles.sceneActions}>
              <Button
                type="primary"
                size="small"
                loading={loading === scene.title}
                onClick={() => handleRun(scene)}
              >
                执行模板
              </Button>
              <Button size="small">文档</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
