import React, { PureComponent } from 'react';

export default (WrappedComponent, getRef) => {
  return class HocComponent extends PureComponent {
    constructor(props) {
      super(props);
      this.__HOCNAME__ = 'HocComponent';
    }

    render() {
      return (
        <WrappedComponent
          ref={comp => {
            if (comp && !comp.__HOCNAME__) comp && getRef && getRef(comp);
          }}
          {...this.props}
        />
      );
    }
  };
};
