import React, { PureComponent } from 'react';

export default (WrappedComponent, getRef) => {
  return class HocComponent extends PureComponent {
    constructor(props) {
      super(props);
      this.testdata = 123;
    }

    render() {
      return (
        <WrappedComponent
          ref={comp => {
            this.comp = comp;
            getRef && getRef(comp);
          }}
          {...this.props}
        />
      );
    }
  };
};
