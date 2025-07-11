import React from 'react';
import { render } from '@testing-library/react';

const mockDispatchTrackingEvent = jest.fn();
jest.setMock('../dispatchTrackingEvent', mockDispatchTrackingEvent);

describe('withTrackingComponentDecorator', () => {
  const withTrackingComponentDecorator =
    require('../withTrackingComponentDecorator').default;

  it('is a decorator (exports a function, that returns a function)', () => {
    expect(typeof withTrackingComponentDecorator).toBe('function');
    const decorated = withTrackingComponentDecorator();
    expect(typeof decorated).toBe('function');
  });

  describe('with process option', () => {
    const props = { props: 1 };
    const trackingContext = { page: 1 };
    const process = jest.fn(() => null);

    @withTrackingComponentDecorator({}, { process })
    class ParentTestComponent extends React.Component {
      static displayName = 'ParentTestComponent';
      render() {
        return this.props.children;
      }
    }

    @withTrackingComponentDecorator(trackingContext)
    class TestComponent extends React.Component {
      static displayName = 'TestComponent';
      render() {
        return null;
      }
    }

    beforeEach(() => {
      mockDispatchTrackingEvent.mockClear();
    });

    it('process function gets called', () => {
      render(
        <ParentTestComponent {...props}>
          <TestComponent />
        </ParentTestComponent>
      );
      expect(process).toHaveBeenCalled();
      expect(mockDispatchTrackingEvent).not.toHaveBeenCalled();
    });
  });

  describe('with process option from parent and dispatchOnMount option on component', () => {
    const props = { props: 1 };
    const trackingContext = { page: 1 };
    const process = jest.fn(() => ({ event: 'pageView' }));
    const dispatchOnMount = jest.fn(() => ({ specificEvent: true }));

    @withTrackingComponentDecorator({}, { process })
    class ParentTestComponent extends React.Component {
      static displayName = 'ParentTestComponent';
      render() {
        return this.props.children;
      }
    }

    @withTrackingComponentDecorator(trackingContext, { dispatchOnMount })
    class TestComponent extends React.Component {
      static displayName = 'TestComponent';
      render() {
        return null;
      }
    }

    beforeEach(() => {
      mockDispatchTrackingEvent.mockClear();
    });

    it('dispatches only once when process and dispatchOnMount functions are passed', () => {
      render(
        <ParentTestComponent {...props}>
          <TestComponent />
        </ParentTestComponent>
      );
      expect(process).toHaveBeenCalled();
      expect(dispatchOnMount).toHaveBeenCalled();
      expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({
        page: 1,
        event: 'pageView',
        specificEvent: true,
      });
      expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('with function trackingContext', () => {
    const props = { page: 1 };
    const trackingContext = jest.fn(p => ({ page: p.page }));
    const process = jest.fn(() => ({ event: 'pageView' }));
    const dispatchOnMount = jest.fn(() => ({ specificEvent: true }));

    @withTrackingComponentDecorator({}, { process })
    class ParentTestComponent extends React.Component {
      static displayName = 'ParentTestComponent';
      render() {
        return this.props.children;
      }
    }

    @withTrackingComponentDecorator(trackingContext, { dispatchOnMount })
    class TestComponent extends React.Component {
      static displayName = 'TestComponent';
      render() {
        return null;
      }
    }

    beforeEach(() => {
      mockDispatchTrackingEvent.mockClear();
    });

    it('dispatches only once when process and dispatchOnMount functions are passed', () => {
      render(
        <ParentTestComponent>
          <TestComponent {...props} />
        </ParentTestComponent>
      );
      expect(process).toHaveBeenCalled();
      expect(dispatchOnMount).toHaveBeenCalled();
      expect(trackingContext).toHaveBeenCalled();
      expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({
        page: 1,
        event: 'pageView',
        specificEvent: true,
      });
      expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('with process option from parent is falsey and dispatchOnMount option is true', () => {
    const props = { props: 1 };
    const trackingContext = { page: 1 };
    const process = jest.fn(() => null);
    const dispatchOnMount = true;

    @withTrackingComponentDecorator({}, { process })
    class ParentTestComponent extends React.Component {
      static displayName = 'ParentTestComponent';
      render() {
        return this.props.children;
      }
    }

    @withTrackingComponentDecorator(trackingContext, { dispatchOnMount })
    class TestComponent extends React.Component {
      static displayName = 'TestComponent';
      render() {
        return null;
      }
    }

    beforeEach(() => {
      mockDispatchTrackingEvent.mockClear();
    });

    it('dispatches only once when process and dispatchOnMount functions are passed', () => {
      render(
        <ParentTestComponent {...props}>
          <TestComponent />
        </ParentTestComponent>
      );
      expect(process).toHaveBeenCalled();
      expect(mockDispatchTrackingEvent).toHaveBeenCalledWith({
        page: 1,
      });
      expect(mockDispatchTrackingEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('with a prop called tracking that has two functions as keys', () => {
    const dummyData = { page: 1 };

    @withTrackingComponentDecorator(dummyData)
    class TestComponent extends React.Component {
      static displayName = 'TestComponent';
      render() {
        // Expose tracking prop for assertions
        return <div data-testid="tracking-prop" {...this.props} />;
      }
    }

    let trackingProp;
    beforeEach(() => {
      mockDispatchTrackingEvent.mockClear();
      render(
        <TestComponent
          ref={el => {
            trackingProp = el;
          }}
        />
      );
    });

    it('prop is named tracking and has two keys, trackEvent and getTrackingData', () => {
      // Access the tracking prop directly via the instance
      const prop = trackingProp.props.tracking;
      expect(prop).toBeDefined();
      expect(prop).toBeInstanceOf(Object);
      expect(prop).toHaveProperty('trackEvent');
      expect(prop).toHaveProperty('getTrackingData');
    });

    it('prop named trackEvent is a function', () => {
      const prop = trackingProp.props.tracking;
      expect(prop.trackEvent).toBeInstanceOf(Function);
    });

    it('when trackEvent is called, from props, it will dispatch event in trackEvent', () => {
      const prop = trackingProp.props.tracking;
      expect(mockDispatchTrackingEvent).not.toHaveBeenCalled();
      prop.trackEvent(dummyData);
      expect(mockDispatchTrackingEvent).toHaveBeenCalledWith(dummyData);
    });

    it('prop named getTrackingData is a function', () => {
      const prop = trackingProp.props.tracking;
      expect(prop.getTrackingData).toBeInstanceOf(Function);
    });

    it('when getTrackingData is called, from props, it will return the data passed to the decorator', () => {
      const prop = trackingProp.props.tracking;
      expect(prop.getTrackingData()).toMatchObject(dummyData);
    });
  });

  describe('hoist non react statics', () => {
    const dummyData = { page: 1 };

    it("should hoist a class's static method when decorated", () => {
      @withTrackingComponentDecorator(dummyData)
      class StaticComponent extends React.Component {
        static someMethod() {
          return 'test';
        }
        static someVar = 'test';
        render() {
          return null;
        }
      }

      expect(StaticComponent.someMethod).toBeDefined();
      expect(StaticComponent.someMethod()).toEqual('test');
      expect(StaticComponent.someVar).toEqual('test');
    });

    it("should hoist a class's static method when wrapped via HoC", () => {
      class StaticComponent extends React.Component {
        static someMethod() {
          return 'test';
        }
        static someVar = 'test';
        render() {
          return null;
        }
      }

      const DecoratedComponent =
        withTrackingComponentDecorator(dummyData)(StaticComponent);

      expect(DecoratedComponent.someMethod).toBeDefined();
      expect(DecoratedComponent.someMethod()).toEqual('test');
      expect(DecoratedComponent.someMethod).toEqual(StaticComponent.someMethod);
      expect(DecoratedComponent.someVar).toEqual('test');
    });
  });
});
