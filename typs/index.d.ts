import * as React from 'react';

type RefArgs = {
  getCurrentRef?: (index?: number) => Object;
  toTabView?: (indexOrLabel?: number | string) => void;
  clearStacks?: (callback?: Function) => void;
}

interface ScrollableTabViewProps {
  ref?: (args: RefArgs) => void;
}

interface ScrollableTabViewState { }

declare module '@itenl/react-native-scrollable-tabview' {
  export default class ScrollableTabView extends React.Component<ScrollableTabViewProps, ScrollableTabViewState> {
    props: ScrollableTabViewProps;
    state: ScrollableTabViewState;
  }
}
