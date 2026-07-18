import {
  ApartmentOutlined,
  BlockOutlined,
  EyeInvisibleOutlined,
  MergeCellsOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
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
    title: 'K-匿名脱敏',
    tag: 'K-Anon',
    tagColor: 'orange',
    description:
      '对标识符与准标识符进行泛化与抑制，确保同一等价组内记录数 ≥ K，降低重识别风险。',
    icon: <MergeCellsOutlined />,
    templateId: PipelineTemplateType.K_ANONYMITY,
    computeMode: ComputeModeType.MPC,
  },
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
    title: '查询混淆',
    tag: 'Query Obfuscation',
    tagColor: 'purple',
    description:
      '对敏感查询进行混淆与伪名替换，生成若干 dummy 查询以隐藏真实意图，适用于医疗等敏感领域。',
    icon: <EyeInvisibleOutlined />,
    templateId: PipelineTemplateType.QUERY_OBFUSCATION,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: 'L-多样性',
    tag: 'L-Diversity',
    tagColor: 'cyan',
    description:
      '在K-匿名基础上确保每个等价组内敏感属性具有至少 L 个不同取值，进一步防止同质性攻击。',
    icon: <ApartmentOutlined />,
    templateId: PipelineTemplateType.L_DIVERSITY,
    computeMode: ComputeModeType.MPC,
  },
  {
    title: '本地差分隐私',
    tag: 'Local DP',
    tagColor: 'magenta',
    description:
      '在数据本地采集阶段对单个样本添加随机化噪声，实现本地化差分隐私保护，无需可信中心。',
    icon: <BlockOutlined />,
    templateId: PipelineTemplateType.LOCAL_DIFFERENTIAL_PRIVACY,
    computeMode: ComputeModeType.MPC,
  },
];

export const PrivacyScenesComponent: React.FC = () => {
  const createProjectService = useModel(CreateProjectService);
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleRun = async (scene: SceneItem) => {
    setLoading(scene.title);
    try {
      let quickConfigs =
        scene.templateId !== PipelineTemplateType.BLANK
          ? await createProjectService.buildScenarioQuickConfigs(scene.templateId)
          : undefined;

      // Fallback for new privacy templates that still need a single alice datatable
      // but are not yet handled by buildScenarioQuickConfigs.
      if (
        !quickConfigs &&
        scene.templateId !== PipelineTemplateType.BLANK &&
        scene.templateId !== PipelineTemplateType.QUERY_OBFUSCATION
      ) {
        const aliceNode = createProjectService.nodeList.find(
          (i) => i.nodeId === 'alice',
        );
        const aliceTable = aliceNode?.datatables?.[0];
        if (aliceTable) {
          quickConfigs = { dataTable: { s: aliceTable.datatableId } };
        }
      }

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
