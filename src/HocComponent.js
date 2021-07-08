import React, { PureComponent } from 'react';

export default (WrappedComponent, getRef) => {
  return class HocComponent extends PureComponent {
    static __HOCNAME__ = 'HocComponent';
    constructor(props) {
      super(props);
      this.__HOCNAME__ = 'HocComponent';
    }

    render() {
      return (
        <WrappedComponent
          ref={comp => {
            // 在使用RN release打包后在sticky获取到的screenContext为HOC上下文，需健全区分__HOCNAME__
            if (comp && !comp.__HOCNAME__) comp && getRef && getRef(comp);
          }}
          {...this.props}
        />
      );
    }
  };
};
