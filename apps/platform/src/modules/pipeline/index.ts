import { createRegistry } from '@secretflow/utils';

import { getModel } from '@/util/valtio-helper';

import type { PipelineTemplateContribution } from './pipeline-protocol';
import { TemplateBlank } from './templates/pipeline-template-blank';
import { TemplateDataClassification } from './templates/pipeline-template-data-classification';
import { TemplateKAnonymity } from './templates/pipeline-template-k-anonymity';
import { TemplateLDiversity } from './templates/pipeline-template-l-diversity';
import { TemplateLocalDifferentialPrivacy } from './templates/pipeline-template-local-differential-privacy';
import { TemplatePrivacy } from './templates/pipeline-template-privacy';
import { TemplateGuidePrivacy } from './templates/pipeline-template-privacy-guide';
import { TemplatePSI } from './templates/pipeline-template-psi';
import { TemplateGuidePSI } from './templates/pipeline-template-psi-guide';
import { TemplateTeePSI } from './templates/pipeline-template-psi-tee';
import { TemplateGuideTeePSI } from './templates/pipeline-template-psi-tee-guide';
import { TemplateQueryObfuscation } from './templates/pipeline-template-query-obfuscation';
import { TemplateRisk } from './templates/pipeline-template-risk';
import { TemplateGuideRisk } from './templates/pipeline-template-risk-guide';
import { TemplateSanitization } from './templates/pipeline-template-sanitization';
import { TemplateScenarioPSI } from './templates/pipeline-template-scenario-psi';
import { TemplateTEE } from './templates/pipeline-template-tee';
import { TemplateGuidTEE } from './templates/pipeline-template-tee-guide';

const PipelineTemplatesRegistry = createRegistry<PipelineTemplateContribution>();

export const getPipelineTemplates = () => PipelineTemplatesRegistry.getData();

/**
 * 注册单例训练流模版
 */
PipelineTemplatesRegistry.register(getModel(TemplatePSI));
PipelineTemplatesRegistry.register(getModel(TemplateTeePSI));
PipelineTemplatesRegistry.register(getModel(TemplateRisk));
PipelineTemplatesRegistry.register(getModel(TemplateTEE));
PipelineTemplatesRegistry.register(getModel(TemplatePrivacy));
PipelineTemplatesRegistry.register(getModel(TemplateBlank));
PipelineTemplatesRegistry.register(getModel(TemplateGuidePSI));
PipelineTemplatesRegistry.register(getModel(TemplateScenarioPSI));
PipelineTemplatesRegistry.register(getModel(TemplateGuideTeePSI));
PipelineTemplatesRegistry.register(getModel(TemplateGuideRisk));
PipelineTemplatesRegistry.register(getModel(TemplateGuidePrivacy));
PipelineTemplatesRegistry.register(getModel(TemplateGuidTEE));
PipelineTemplatesRegistry.register(getModel(TemplateDataClassification));
PipelineTemplatesRegistry.register(getModel(TemplateKAnonymity));
PipelineTemplatesRegistry.register(getModel(TemplateLDiversity));
PipelineTemplatesRegistry.register(getModel(TemplateLocalDifferentialPrivacy));
PipelineTemplatesRegistry.register(getModel(TemplateQueryObfuscation));
PipelineTemplatesRegistry.register(getModel(TemplateSanitization));
