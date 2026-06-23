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
  listProject: jest.fn().mockResolvedValue({
    data: [
      { projectId: 'p1', projectName: 'project-1' },
      { projectId: 'p2', projectName: 'project-2' },
    ],
    status: { code: 0 },
  }),
  listJob: jest.fn().mockResolvedValue({
    data: { list: [{ jobId: 'job-1' }], total: 1 },
    status: { code: 0 },
  }),
  deleteProject: jest.fn().mockResolvedValue({ status: { code: 0 } }),
  updateProject: jest.fn().mockResolvedValue({ status: { code: 0 } }),
}));

jest.mock('@/services/secretpad/GraphController', () => ({
  listGraph: jest.fn().mockResolvedValue({
    data: [{ graphId: 'g1', name: 'pipeline-1' }],
    status: { code: 0 },
  }),
}));

jest.mock('antd', () => ({
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { ProjectListService } from './project-list.service';

describe('ProjectListService', () => {
  let service: ProjectListService;

  beforeEach(() => {
    service = new ProjectListService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and reverse project list', async () => {
    const { listProject } = await import('@/services/secretpad/ProjectController');

    const result = await service.getListProject();

    expect(listProject).toHaveBeenCalled();
    expect(service.projectListLoading).toBe(false);
    expect(result).toEqual([
      { projectId: 'p2', projectName: 'project-2' },
      { projectId: 'p1', projectName: 'project-1' },
    ]);
    expect(service.projectList).toEqual(result);
  });

  it('should fetch pipeline list for a project', async () => {
    const { listGraph } = await import('@/services/secretpad/GraphController');

    const result = await service.getPipelines('p1');

    expect(listGraph).toHaveBeenCalledWith({ projectId: 'p1' });
    expect(result).toEqual([{ graphId: 'g1', name: 'pipeline-1' }]);
  });

  it('should fetch job list for a project', async () => {
    const { listJob } = await import('@/services/secretpad/ProjectController');

    const result = await service.getJobs('p1');

    expect(listJob).toHaveBeenCalledWith({
      projectId: 'p1',
      pageNum: 1,
      pageSize: 10,
    });
    expect(result).toEqual({ list: [{ jobId: 'job-1' }], total: 1 });
  });

  it('should delete a project and return status', async () => {
    const { deleteProject } = await import('@/services/secretpad/ProjectController');

    const result = await service.deleteProject('p1');

    expect(deleteProject).toHaveBeenCalledWith({ projectId: 'p1' });
    expect(result).toEqual({ code: 0 });
  });

  it('should update a project and show success message', async () => {
    const { updateProject } = await import('@/services/secretpad/ProjectController');
    const { message } = await import('antd');

    await service.updateProject({
      projectId: 'p1',
      name: 'new-name',
      description: 'new-desc',
    });

    expect(updateProject).toHaveBeenCalledWith({
      projectId: 'p1',
      name: 'new-name',
      description: 'new-desc',
    });
    expect(message.success).toHaveBeenCalledWith('项目名称修改成功');
  });
});
