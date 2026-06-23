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
  listJob: jest.fn().mockResolvedValue({
    data: { list: [{ jobId: 'job-1' }], total: 1 },
    status: { code: 0 },
  }),
}));

jest.mock('@/services/secretpad/ScheduledController', () => ({
  listJob: jest.fn().mockResolvedValue({
    data: { list: [{ jobId: 'scheduled-job-1' }], total: 1 },
    status: { code: 0 },
  }),
}));

jest.mock('umi', () => ({
  history: {
    location: {
      state: {},
    },
  },
}));

import { DefaultRecordService } from './record-service';
import { PeriodicDetailType } from '../periodic-task/type';

describe('DefaultRecordService', () => {
  let service: DefaultRecordService;

  beforeEach(() => {
    service = new DefaultRecordService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch normal execution records', async () => {
    const { listJob } = await import('@/services/secretpad/ProjectController');

    const result = await service.getRecordList('p1', 'g1', 10, 1);

    expect(listJob).toHaveBeenCalledWith({
      projectId: 'p1',
      graphId: 'g1',
      pageNum: 1,
      pageSize: 10,
    });
    expect(result).toEqual({ list: [{ jobId: 'job-1' }], total: 1 });
    expect(service.recordList).toEqual(result);
  });

  it('should fetch periodic child task records', async () => {
    const { listJob: scheduledListJob } = await import(
      '@/services/secretpad/ScheduledController'
    );
    const { history } = await import('umi');
    history.location.state = {
      periodicType: PeriodicDetailType.CHILDTASK,
      scheduleTaskId: 'schedule-1',
    };

    const result = await service.getRecordList('p1', 'g1', 10, 1);

    expect(scheduledListJob).toHaveBeenCalledWith({
      projectId: 'p1',
      graphId: 'g1',
      pageNum: 1,
      pageSize: 10,
      scheduleTaskId: 'schedule-1',
    });
    expect(result).toEqual({ list: [{ jobId: 'scheduled-job-1' }], total: 1 });
  });

  it('should find a record by job id', async () => {
    service.recordList = {
      data: [{ jobId: 'job-1', name: 'record-1' }],
    } as any;

    const result = await service.getRecord('job-1');

    expect(result).toEqual({ jobId: 'job-1', name: 'record-1' });
    expect(service.currentRecord).toEqual(result);
  });

  it('should set current record graph', () => {
    service.currentRecord = { jobId: 'job-1' } as any;
    const graph = { nodes: [], edges: [] };

    service.setCurrentRecordGraph(graph);

    expect(service.currentRecord?.graph).toEqual(graph);
  });

  it('should filter graph nodes by selected result type', () => {
    service.currentRecord = {
      graph: {
        nodes: [
          { graphNodeId: 'n1', results: [{ kind: 'model' }] },
          { graphNodeId: 'n2', results: [{ kind: 'rule' }] },
          { graphNodeId: 'n3' },
        ],
      },
    } as any;
    service.resultTypeSelected = 'model' as any;

    const result = service.filterGraphNodeByType();

    expect(result).toEqual([
      { graphNodeId: 'n2', results: [{ kind: 'rule' }] },
      { graphNodeId: 'n3' },
    ]);
  });

  it('should change record drawer state', () => {
    service.changeRecordDrawer(true);
    expect(service.recordDrawer).toBe(true);
  });
});
