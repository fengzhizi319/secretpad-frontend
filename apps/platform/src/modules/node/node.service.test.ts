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

jest.mock('@/services/secretpad', () => {
  const listNode = jest.fn().mockResolvedValue({
    data: [
      { nodeId: 'alice', nodeName: 'Alice' },
      { nodeId: 'bob', nodeName: 'Bob' },
    ],
    status: { code: 0 },
  });
  const NodeController = { listNode };
  return {
    __esModule: true,
    default: { NodeController },
    NodeController,
  };
});

import { NodeService } from './node.service';

describe('NodeService', () => {
  let service: NodeService;

  beforeEach(() => {
    service = new NodeService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list all registered nodes', async () => {
    const API = (await import('@/services/secretpad')).default;

    const result = await service.listNode();

    expect(API.NodeController.listNode).toHaveBeenCalled();
    expect(result).toEqual([
      { nodeId: 'alice', nodeName: 'Alice' },
      { nodeId: 'bob', nodeName: 'Bob' },
    ]);
  });

  it('should list edge nodes by delegating to listNode', async () => {
    const API = (await import('@/services/secretpad')).default;

    const result = await service.edgeListNode('alice');

    expect(API.NodeController.listNode).toHaveBeenCalled();
    expect(result).toEqual([
      { nodeId: 'alice', nodeName: 'Alice' },
      { nodeId: 'bob', nodeName: 'Bob' },
    ]);
  });

  it('should set current node and emit event', () => {
    const node = { nodeId: 'alice', nodeName: 'Alice' } as any;
    let emittedNode: any;
    service.eventEmitter.on((n) => {
      emittedNode = n;
    });

    service.setCurrentNode(node);

    expect(service.currentNode).toEqual(node);
    expect(emittedNode).toEqual(node);
  });
});
