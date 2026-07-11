import '@secretflow/testing/jest';

jest.mock('@/util/valtio-helper', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
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

jest.mock('@/services/secretpad/DatatableController', () => ({
  listDatatables: jest.fn().mockResolvedValue({
    data: {
      list: [
        { datatableId: 'dt-1', datatableName: 'table-1' },
        { datatableId: 'dt-2', datatableName: 'table-2' },
      ],
      total: 2,
    },
    status: { code: 0 },
  }),
}));

import { DataManagerService } from './data-manager.service';

describe('DataManagerService', () => {
  let service: DataManagerService;

  beforeEach(() => {
    service = new DataManagerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list data tables with filters', async () => {
    const { listDatatables } = await import('@/services/secretpad/DatatableController');

    const result = await service.listDataTables(
      'alice',
      1,
      20,
      'SUCCESS',
      'keyword',
      ['CSV', 'OSS'],
      ['node-1'],
    );

    expect(listDatatables).toHaveBeenCalledWith({
      ownerId: 'alice',
      pageNumber: 1,
      pageSize: 20,
      statusFilter: 'SUCCESS',
      datatableNameFilter: 'keyword',
      types: ['CSV', 'OSS'],
      nodeNamesFilter: ['node-1'],
    });
    expect(result).toEqual({
      list: [
        { datatableId: 'dt-1', datatableName: 'table-1' },
        { datatableId: 'dt-2', datatableName: 'table-2' },
      ],
      total: 2,
    });
  });
});
