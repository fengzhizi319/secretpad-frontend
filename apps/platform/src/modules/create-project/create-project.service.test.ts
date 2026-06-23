import '@secretflow/testing/jest';

jest.mock('@/util/valtio-helper', () => {
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

jest.mock('@/services/secretpad/ProjectController', () => ({
  createProject: jest.fn().mockResolvedValue({
    data: { projectId: 'project-test-001' },
    status: { code: 0, msg: 'ok' },
  }),
  addProjectNode: jest.fn().mockResolvedValue({ status: { code: 0 } }),
  addProjectInst: jest.fn().mockResolvedValue({ status: { code: 0 } }),
  addProjectDatatable: jest.fn().mockResolvedValue({ status: { code: 0 } }),
  getTeeNodeList: jest.fn().mockResolvedValue({ data: [{ nodeId: 'tee-001' }] }),
}));

jest.mock('@/services/secretpad/DatatableController', () => ({
  getDatatable: jest.fn().mockResolvedValue({
    data: { datatableId: 'dt-001', nodeId: 'alice' },
    status: { code: 0 },
  }),
}));

jest.mock('umi', () => ({
  history: {
    push: jest.fn(),
  },
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/modules/login/login.service', () => ({
  LoginService: class MockLoginService {
    userInfo: Record<string, any> | null = null;
  },
}));

jest.mock('@/modules/node', () => ({
  NodeService: class MockNodeService {
    async listNode() {
      return [
        {
          nodeId: 'alice',
          datatables: [{ datatableId: 'alice-dt-1' }],
        },
        {
          nodeId: 'bob',
          datatables: [{ datatableId: 'bob-dt-1' }],
        },
      ];
    }

    async edgeListNode() {
      return [];
    }
  },
}));

jest.mock('@/modules/pipeline', () => ({
  getPipelineTemplates: jest.fn().mockReturnValue([
    {
      type: 'blank',
      name: '自定义训练流',
      argsFilled: false,
      content: () => ({ nodes: [], edges: [] }),
    },
  ]),
  PipelineTemplateType: {
    BLANK: 'blank',
    RISK: 'risk',
    PSI: 'psi',
  },
}));

jest.mock('@/modules/pipeline/pipeline-service', () => ({
  DefaultPipelineService: class MockDefaultPipelineService {
    createPipeline = jest.fn().mockResolvedValue({
      id: 'graph-001',
      name: '自定义训练流',
    });
  },
}));

jest.mock('../p2p-project-list/components/common', () => ({
  ComputeModeType: {
    MPC: 'MPC',
    TEE: 'TEE',
    ALL: 'all',
  },
}));

jest.mock('../pipeline/pipeline-protocol', () => ({
  PipelineTemplateType: {
    BLANK: 'blank',
    RISK: 'risk',
    PSI: 'psi',
    'PSI_TEE': 'psi-tee',
    'PSI_TEE_GUIDE': 'psi-tee-guide',
    'RISK_GUIDE': 'risk-guide',
    'PSI_GUIDE': 'psi-guide',
    'TEE': 'TEE',
    'TEE_GUIDE': 'tee-guide',
  },
}));

import { CreateProjectService } from './create-project.service';

describe('CreateProjectService', () => {
  let service: CreateProjectService;

  beforeEach(() => {
    service = new CreateProjectService();
    service.loginService.userInfo = {
      platformType: 'CENTER',
      ownerType: 'CENTER',
      ownerId: 'alice',
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a project with blank template in MPC mode', async () => {
    const { createProject, addProjectNode, addProjectInst, addProjectDatatable } =
      await import('@/services/secretpad/ProjectController');
    const { history } = await import('umi');

    await service.createProject(
      {
        projectName: 'test-project',
        description: 'test description',
        computeMode: 'MPC' as any,
        templateId: 'blank' as any,
        nodes: ['alice', 'bob'],
      },
      true,
    );

    expect(service.nodeList).toHaveLength(2);

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-project',
        description: 'test description',
        computeMode: 'MPC',
      }),
    );

    expect(addProjectNode).toHaveBeenCalledTimes(2);
    expect(addProjectNode).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-test-001', nodeId: 'alice' }),
    );
    expect(addProjectNode).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-test-001', nodeId: 'bob' }),
    );

    expect(addProjectInst).toHaveBeenCalledTimes(2);
    expect(addProjectInst).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-test-001', instId: 'alice' }),
    );
    expect(addProjectInst).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'project-test-001', instId: 'bob' }),
    );

    expect(addProjectDatatable).not.toHaveBeenCalled();

    expect(service.pipelineService.createPipeline).toHaveBeenCalledWith(
      '自定义训练流',
      'blank',
      'project-test-001',
    );

    expect(history.push).toHaveBeenCalledWith(
      {
        pathname: '/dag',
        search: 'projectId=project-test-001&mode=MPC',
      },
      { origin: 'project-management' },
    );
  });

  it('should throw an error when createProject API returns a non-zero code', async () => {
    const { createProject } = await import('@/services/secretpad/ProjectController');
    (createProject as jest.Mock).mockResolvedValueOnce({
      data: null,
      status: { code: 500, msg: 'server error' },
    });

    await expect(
      service.createProject(
        {
          projectName: 'failed-project',
          description: '',
          computeMode: 'MPC' as any,
          templateId: 'blank' as any,
          nodes: ['alice', 'bob'],
        },
        true,
      ),
    ).rejects.toThrow('server error');
  });
});
