import React from 'react';
import { StyleSheet, Text, View, SectionList, RefreshControl, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import Carousel from '@itenl/react-native-snap-carousel';
import HocComponent from './HocComponent';
import _throttle from 'lodash.throttle';
import packagejson from '../package.json';
import { initScreen, triggerOnce, refreshMap, onRefresh, triggerRefresh, onEndReached, triggerEndReached } from './useRefreshEndReached';
const deviceWidth = Dimensions.get('window').width;

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const AnimatedCarousel = Animated.createAnimatedComponent(Carousel);

const CONSOLE_LEVEL = {
  LOG: 'log',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * @author itenl
 * @class ScrollableTabView
 * @extends {React.Component}
 */
export default class ScrollableTabView extends React.Component {
  static propTypes = {
    stacks: PropTypes.array.isRequired,
    firstIndex: PropTypes.number,
    mappingProps: PropTypes.object,
    header: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    stickyHeader: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    badges: PropTypes.array,
    tabsStyle: PropTypes.object,
    tabWrapStyle: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    tabInnerStyle: PropTypes.object,
    tabActiveOpacity: PropTypes.number,
    tabStyle: PropTypes.object,
    tabsEnableAnimated: PropTypes.bool,
    tabsEnableAnimatedUnderlineWidth: PropTypes.number,
    useScrollStyle: PropTypes.object,
    textStyle: PropTypes.object,
    textActiveStyle: PropTypes.object,
    tabUnderlineStyle: PropTypes.object,
    syncToSticky: PropTypes.bool,
    onEndReachedThreshold: PropTypes.number,
    onBeforeRefresh: PropTypes.func,
    onBeforeEndReached: PropTypes.func,
    onTabviewChanged: PropTypes.func,
    oneTabHidden: PropTypes.bool,
    enableCachePage: PropTypes.bool,
    carouselProps: PropTypes.object,
    sectionListProps: PropTypes.object,
    toHeaderOnTab: PropTypes.bool,
    toTabsOnTab: PropTypes.bool,
    tabsShown: PropTypes.bool,
    fixedTabs: PropTypes.bool,
    fixedHeader: PropTypes.bool,
    useScroll: PropTypes.bool,
    fillScreen: PropTypes.bool,
    title: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    titleArgs: PropTypes.object,
    onScroll: PropTypes.func,
    onScroll2Horizontal: PropTypes.func,
    screenScrollThrottle: PropTypes.number,
    errorToThrow: PropTypes.bool
  };

  static defaultProps = {
    stacks: [],
    firstIndex: null,
    mappingProps: {},
    header: null,
    stickyHeader: null,
    badges: [],
    tabsStyle: {},
    tabWrapStyle: {},
    tabInnerStyle: {},
    tabActiveOpacity: 0.6,
    tabStyle: {},
    tabsEnableAnimated: false,
    tabsEnableAnimatedUnderlineWidth: 0,
    useScrollStyle: {},
    textStyle: {},
    textActiveStyle: {},
    tabUnderlineStyle: {},
    syncToSticky: true,
    onEndReachedThreshold: 0.2,
    onBeforeRefresh: null,
    onBeforeEndReached: null,
    onTabviewChanged: null,
    oneTabHidden: false,
    enableCachePage: true,
    carouselProps: {},
    sectionListProps: {},
    toHeaderOnTab: false,
    toTabsOnTab: false,
    tabsShown: true,
    fixedTabs: false,
    fixedHeader: false,
    useScroll: false,
    fillScreen: true,
    title: null,
    titleArgs: {
      style: {},
      interpolateOpacity: {},
      interpolateHeight: {}
    },
    onScroll: null,
    onScroll2Horizontal: null,
    screenScrollThrottle: 60,
    errorToThrow: false
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this._initialState()
    };
    this._initialProperty();
    this._initial();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    this._initial(newProps, true);
  }

  _initialState() {
    return {
      checkedIndex: this._getFirstIndex(),
      refsObj: {},
      lazyIndexs: this._initLazyIndexs(),
      isRefreshing: false
    };
  }

  _initialProperty() {
    const { screenScrollThrottle } = this.props;
    this.scroll2VerticalPos = new Animated.Value(0);
    this.scroll2HorizontalPos = new Animated.Value(0);
    this.tabsMeasurements = [];
    this.tabWidth = 0;
    this.tabWidthWrap = 0;
    this.layoutHeight = {
      container: 0,
      header: 0,
      stickyHeader: 0,
      tabs: 0,
      screen: 0
    };
    this.titleInterpolateArgs = {
      height: {
        inputRange: [0, 160],
        outputRange: [0, 80],
        extrapolate: 'clamp'
      },
      opacity: {
        inputRange: [160, 320],
        outputRange: [0.2, 1],
        extrapolate: 'clamp'
      }
    };
    this.tabUnderlineInterpolateArgs = {
      inputRange: [],
      outputRange: [],
      extrapolate: 'clamp'
    };
    this._throttleCallback = _throttle(this._onTabviewChange.bind(this, true), screenScrollThrottle, {
      leading: false,
      trailing: true
    });
    this._renderSectionHeader = this._renderSectionHeader.bind(this);
    this._onRefresh = this._onRefresh.bind(this);
    this._onEndReached = this._onEndReached.bind(this);
    this._renderItem = this._renderItem.bind(this);
    this._toggledRefreshing = this._toggledRefreshing.bind(this);
    this._onScroll2Vertical = this._onScroll2Vertical.bind(this);
    this._onScroll2Horizontal = this._onScroll2Horizontal.bind(this);
    this._setScrollHandler2Vertical();
    this._setScrollHandler2Horizontal();
  }

  _initial(props = this.props, isProcess = false) {
    isProcess && this._toProcess(props);
    this.tabs = this._getTabs(props);
    this.badges = this._getBadges(props);
    this.stacks = this._getWrapChildren(props);
    if (props.firstIndex > Math.max(this.stacks.length - 1, 0)) this._displayConsole('firstIndex cannot exceed the total number of stacks.length', CONSOLE_LEVEL.ERROR);
  }

  /**
   * 避免reset栈时的默认 firstIndex 超出当前选中索引导致无法显示视图
   * @param {*} props
   * @memberof ScrollableTabView
   */
  _toProcess(props) {
    if (props.stacks && props.stacks.length && props.stacks.length != this.stacks.length && props.firstIndex != this.state.checkedIndex) {
      const timer = setTimeout(() => {
        this._onTabviewChange(false, props.firstIndex);
        clearTimeout(timer);
      });
    }
  }

  _getTabs(props) {
    return (
      props.stacks &&
      props.stacks.map((item, index) => {
        return {
          tabLabel: item.tabLabel || item.screen?.name,
          tabLabelRender: item.tabLabelRender ?? null,
          index
        };
      })
    );
  }

  _getBadges(props) {
    return (
      props.stacks &&
      props.stacks.map(item => {
        return item.badge ?? null;
      })
    );
  }

  _makeStacksID(item) {
    if (item && !item.__id__) item.__id__ = `${Math.random().toString().slice(2, 8)}_${Date.now().toString().slice(2, 8)}`;
  }

  _getWrapChildren(props) {
    return (
      props.stacks &&
      props.stacks.map((item, index) => {
        if (item.screen) {
          if (this.isClassCompoent(item.screen) && !item.screen.__HOCNAME__) {
            this._makeStacksID(item);
            item.screen = HocComponent(item.screen, this._setCurrentRef(index, item.__id__));
          } else {
            this._makeStacksID(item);
            triggerOnce(item.screen, this._setCurrentRef(index, item.__id__));
          }
        }
        return item;
      })
    );
  }

  _setCurrentRef(index, id) {
    return ref => {
      if (this.state.refsObj[index] && this.state.refsObj[index] === ref) return;
      this.state.refsObj[index] = ref;
      this.state.refsObj[index].__id__ = id;
      this.setState({
        refsObj: this.state.refsObj
      });
    };
  }

  clearStacks = callback => {
    this.tabs = [];
    this.badges = [];
    this.stacks = [];
    this.setState(
      {
        ...this._initialState()
      },
      () => typeof callback === 'function' && callback()
    );
  };

  getCurrentRef(index) {
    return this.state.refsObj[index ?? this.state.checkedIndex];
  }

  toTabView = indexOrLabel => {
    switch (typeof indexOrLabel) {
      case 'number':
        this._onTabviewChange(false, indexOrLabel);
        break;
      case 'string':
        const tab = this.tabs.filter(f => f.tabLabel == indexOrLabel)[0];
        if (tab) {
          this._onTabviewChange(false, tab.index);
        }
        break;
    }
  };

  /**
   * y 轴偏移量，0以Tab为基准点
   * @memberof ScrollableTabView
   */
  _scrollTo = y => {
    if (typeof y == 'number') {
      this.section?.scrollToLocation({
        itemIndex: 0,
        viewOffset: 0 - y,
        sectionIndex: 0
      });
    }
  };

  _initLazyIndexs() {
    let lazyIndexs = [],
      firstIndex = this._getFirstIndex();
    if (firstIndex != null) lazyIndexs.push(firstIndex);
    return lazyIndexs;
  }

  _getFirstIndex() {
    const { firstIndex, stacks } = this.props;
    if (typeof firstIndex === 'number' && stacks && stacks.length) {
      return this.props.firstIndex;
    } else {
      return null;
    }
  }

  /**
   * 作为吸顶组件与Screen之间的桥梁，用于同步吸顶组件与Screen之间的状态
   * @memberof ScrollableTabView
   */
  _refresh = () => {
    this.setState({});
  };

  _getProps(props, screen) {
    return Object.assign(
      {
        refresh: this._refresh,
        scrollTo: this._scrollTo,
        toTabView: this.toTabView,
        layoutHeight: this.layoutHeight
      },
      !!screen && {
        initScreen: () => initScreen(screen),
        onRefresh: callback => {
          if (!screen.onRefresh) {
            screen.onRefresh = () => callback(this._toggledRefreshing);
          }
          onRefresh(screen, callback);
        },
        onEndReached: callback => onEndReached(screen, callback)
      },
      props || {}
    );
  }

  _renderSticky() {
    const stacks = this.props.stacks[this.state.checkedIndex];
    const ref = this.getCurrentRef();
    if (stacks && stacks.sticky && typeof stacks.sticky == 'function' && ref && stacks.__id__ === ref.__id__) {
      // 用于自动同步 Screen 数据流改变后仅会 render 自身 Screen 的问题，用于自动同步 screenContext 给吸顶组件
      if (this.props.syncToSticky && !ref.__isOverride__ && this.isClassCompoent(ref.constructor)) {
        const originalDidUpdate = ref.componentDidUpdate,
          context = this;
        ref.componentDidUpdate = function () {
          context._refresh();
          originalDidUpdate && originalDidUpdate.apply(this, [...arguments]);
        };
        ref.__isOverride__ = true;
      }
      return <stacks.sticky {...this._getProps(this.props.mappingProps || {})} screenContext={ref}></stacks.sticky>;
    }
    return null;
  }

  _renderBadges(tabIndex) {
    const { useScroll, badges } = this.props;
    const _badges = this.badges[tabIndex] || badges[tabIndex];
    if (_badges && _badges.length) {
      if (useScroll) this._displayConsole('When useScroll and badges exist at the same time, the badge will not overflow the Tabs container');
      return _badges.map(item => {
        return item;
      });
    }
    return null;
  }

  _measureTab(pageIndex, { nativeEvent }) {
    const { x, width, height } = nativeEvent.layout;
    this.tabsMeasurements[pageIndex] = { left: x, right: x + width, width, height };
  }

  _renderTab({ item, index }) {
    const { tabActiveOpacity, tabWrapStyle, tabInnerStyle, tabStyle, textStyle, textActiveStyle, tabUnderlineStyle, tabsEnableAnimated } = this.props;
    const _tabUnderlineStyle = Object.assign({ top: 6 }, styles.tabUnderlineStyle, tabUnderlineStyle);
    const _checked = this.state.checkedIndex == index;
    const _tabWrapStyle = typeof tabWrapStyle === 'function' ? tabWrapStyle(item, index, _checked) : tabWrapStyle;
    const _tab = typeof item.tabLabelRender === 'function' ? item.tabLabelRender(item.tabLabel, index, _checked) : item.tabLabel;
    return (
      <View onLayout={this._measureTab.bind(this, index)} key={index} style={_tabWrapStyle}>
        {this._renderBadges(index)}
        <TouchableOpacity activeOpacity={tabActiveOpacity} onPress={() => this._onTabviewChange(false, index)} style={[styles.tabStyle, tabStyle]}>
          <View style={tabInnerStyle}>
            {typeof _tab === 'string' ? <Text style={[styles.textStyle, textStyle, _checked && textActiveStyle]}>{_tab}</Text> : _tab}
            {!tabsEnableAnimated && _checked && <View style={_tabUnderlineStyle}></View>}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  _getTabUnderlineInterpolateArgs(tabsEnableAnimatedUnderlineWidth) {
    const maxTranslateXCount = this.tabs.length * 2 - 1;
    if (maxTranslateXCount === this.tabUnderlineInterpolateArgs.inputRange.length) return this.tabUnderlineInterpolateArgs;
    const _outputRange = [];
    const _inputRange = Array.from({ length: maxTranslateXCount }, (v, k) => {
      _outputRange.push(k % 2 ? this.tabWidth / tabsEnableAnimatedUnderlineWidth : 1);
      return k == 0 ? k : (k * deviceWidth) / 2;
    });
    this.tabUnderlineInterpolateArgs.inputRange = _inputRange;
    this.tabUnderlineInterpolateArgs.outputRange = _outputRange;
    return this.tabUnderlineInterpolateArgs;
  }

  _renderAnimatedTabUnderline() {
    const { useScroll, tabUnderlineStyle, useScrollStyle, tabStyle, tabsEnableAnimatedUnderlineWidth } = this.props;
    const { marginLeft, marginRight, marginHorizontal } = tabStyle;
    const { paddingLeft, paddingHorizontal } = useScrollStyle;
    const _tabUnderlineStyle = Object.assign({ zIndex: 100, width: this.tabWidth, position: 'absolute' }, styles.tabUnderlineStyle, tabUnderlineStyle);
    if (!_tabUnderlineStyle.top && _tabUnderlineStyle.height) _tabUnderlineStyle.top = this.layoutHeight['tabs'] - _tabUnderlineStyle.height;
    let underlineLeft = marginLeft || marginHorizontal || 0;
    let underlineRight = marginRight || marginHorizontal || 0;
    let outputLeft = 0;
    let outputRight = deviceWidth;
    this.tabWidthWrap = this.tabWidth + underlineLeft + underlineRight;
    if (useScroll) {
      outputLeft = paddingLeft || paddingHorizontal || 0;
      outputRight = this.tabWidthWrap * this.tabs.length;
    }
    outputLeft = outputLeft + underlineLeft;
    outputRight = outputRight + outputLeft;
    const interpolateAnimated = {
      transform: [
        {
          translateX: this.scroll2HorizontalPos.interpolate({
            inputRange: [0, this.tabs.length * deviceWidth],
            outputRange: [outputLeft, outputRight],
            extrapolate: 'clamp'
          })
        }
      ]
    };
    if (!!tabsEnableAnimatedUnderlineWidth) {
      if (tabsEnableAnimatedUnderlineWidth >= this.tabWidth / 2) this._displayConsole('The value of tabsEnableAnimatedUnderlineWidth we recommend to be one-third of tabStyle.width or a fixed 30px');
      interpolateAnimated.marginLeft = this.tabWidth / 2 - tabsEnableAnimatedUnderlineWidth / 2;
      interpolateAnimated.width = tabsEnableAnimatedUnderlineWidth;
      interpolateAnimated.transform.push({ scaleX: this.scroll2HorizontalPos.interpolate(this._getTabUnderlineInterpolateArgs(tabsEnableAnimatedUnderlineWidth)) });
    }
    return <Animated.View style={[styles.tabUnderlineStyle, _tabUnderlineStyle, interpolateAnimated]}></Animated.View>;
  }

  _displayConsole(message, level = CONSOLE_LEVEL.LOG) {
    const { errorToThrow } = this.props;
    const pluginName = packagejson.name;
    const msg = `${pluginName}: ${message || ' --- '}`;
    console[level](msg);
    if (errorToThrow && level == CONSOLE_LEVEL.ERROR) throw new Error(msg);
  }

  _errorProps(propName, level) {
    const props = this.props,
      property = props[propName],
      errorProps = {
        tabStyle: ['left', 'right']
      };
    if (errorProps[propName] && property) {
      errorProps[propName].forEach(errorProperty => {
        if (errorProperty in property) {
          this._displayConsole(`Prop ${propName} is not allowed to configure the ${errorProperty} property`, level);
        }
      });
    }
  }

  _renderTabs() {
    const { oneTabHidden, tabsShown, tabsStyle, tabStyle, useScroll, tabsEnableAnimated, useScrollStyle } = this.props;
    const { width } = tabStyle;
    if (tabsEnableAnimated && tabStyle && width == undefined) this._displayConsole('When tabsEnableAnimated is true, the width must be specified for tabStyle', CONSOLE_LEVEL.ERROR);
    if (useScroll && tabStyle && width == undefined) this._displayConsole('When useScroll is true, the width must be specified for tabStyle', CONSOLE_LEVEL.ERROR);
    const renderTab = !(oneTabHidden && this.tabs && this.tabs.length == 1) && tabsShown;
    const _tabsStyle = Object.assign({}, !useScroll && { alignItems: 'center', justifyContent: 'space-around' }, styles.tabsStyle, tabsStyle);
    this.layoutHeight['tabs'] = renderTab ? _tabsStyle.height : 0;
    this.tabWidth = width;
    this._errorProps('tabStyle', CONSOLE_LEVEL.ERROR);
    return (
      renderTab &&
      this.tabs &&
      !!this.tabs.length &&
      (useScroll ? (
        <ScrollView
          contentContainerStyle={useScrollStyle}
          style={_tabsStyle}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ref={rf => (this.scrollview = rf)}
          horizontal={true}
        >
          {this.tabs.map((tab, index) => this._renderTab({ item: tab, index }))}
          {tabsEnableAnimated && this.state.checkedIndex !== null && this._renderAnimatedTabUnderline()}
        </ScrollView>
      ) : (
        <View style={_tabsStyle}>
          {this.tabs.map((tab, index) => this._renderTab({ item: tab, index }))}
          {tabsEnableAnimated && this.state.checkedIndex !== null && this._renderAnimatedTabUnderline()}
        </View>
      ))
    );
  }

  _renderSectionHeader() {
    const { fixedHeader } = this.props;
    return (
      <View style={{ flex: 1 }}>
        {this._renderHeader(fixedHeader)}
        {this._renderStickyHeader()}
        {this._renderTabs()}
        {this._renderSticky()}
      </View>
    );
  }

  // 启用 useScroll 情况下保证滚动条跟随
  _tabTranslateX(index = this.state.checkedIndex) {
    const { useScroll } = this.props;
    const width = this.tabWidthWrap || this.tabWidth;
    if (useScroll && this.scrollview && width) {
      this.scrollview.scrollTo({
        x: (index - 1) * width + width / 2
      });
    }
  }

  _resetOtherRefs() {
    const checkedIndex = this.state.checkedIndex;
    if (this.state.refsObj && this.state.refsObj[checkedIndex]) this.state.refsObj[checkedIndex] = null;
    return this.state.refsObj;
  }

  _onTabviewChange(isCarouselScroll, index) {
    if (!this.stacks.length) return;
    if (!this.stacks[index]) return;
    const { enableCachePage, toHeaderOnTab, toTabsOnTab, onTabviewChanged } = this.props;
    if (index == this.state.checkedIndex) {
      if (!isCarouselScroll && toHeaderOnTab) return this._scrollTo(-(this.layoutHeight['header'] + this.layoutHeight['stickyHeader']));
      if (!isCarouselScroll && toTabsOnTab) return this._scrollTo(0);
      return void 0;
    }
    let state = {
        checkedIndex: index,
        lazyIndexs: this.state.lazyIndexs
      },
      isFirst = false;
    if (!enableCachePage) {
      isFirst = true;
      state.refsObj = this._resetOtherRefs();
      state.lazyIndexs = [index];
    } else {
      if (!this._getLazyIndexs(index)) state.lazyIndexs.push(index), (isFirst = true);
    }
    this.setState(state, () => {
      if (onTabviewChanged) {
        const tab = this.tabs[this.state.checkedIndex];
        onTabviewChanged(this.state.checkedIndex, tab && tab.tabLabel, isFirst);
      }
    });
    this._tabTranslateX(index);
    // 切换后强制重置刷新状态
    this._toggledRefreshing(false);
  }

  _getLazyIndexs(index) {
    return this.state.lazyIndexs.includes(index);
  }

  _getScreenHeight() {
    this.layoutHeight['screen'] = this.layoutHeight['container'] - (this.layoutHeight['header'] + this.layoutHeight['stickyHeader'] + this.layoutHeight['tabs']);
    return this.layoutHeight['screen'];
  }

  _getMaximumScreenHeight() {
    return this.layoutHeight['container'] - this.layoutHeight['stickyHeader'] - this.layoutHeight['tabs'];
  }

  isClassCompoent(component) {
    return !!(component.prototype && component.prototype.isReactComponent);
  }

  _renderItem({ item, index }) {
    const { enableCachePage, fillScreen, fixedTabs, mappingProps } = this.props;
    const screenHeight = this._getScreenHeight();
    return (
      (enableCachePage ? enableCachePage : this.state.checkedIndex == index) &&
      (this.getCurrentRef(index) || this.getCurrentRef(index) == undefined) &&
      this._getLazyIndexs(index) && (
        <View
          style={[
            { flex: 1 },
            enableCachePage && this.state.checkedIndex != index && { maxHeight: screenHeight },
            enableCachePage && this.state.checkedIndex == index && fillScreen && { minHeight: screenHeight },
            enableCachePage && this.state.checkedIndex == index && fixedTabs && { minHeight: this._getMaximumScreenHeight() },
            !enableCachePage && this.state.checkedIndex == index && { minHeight: screenHeight }
          ]}
        >
          <item.screen {...this._getProps(mappingProps, !this.isClassCompoent(item.screen) && item.screen)} {...(item.toProps || {})} />
        </View>
      )
    );
  }

  _onEndReached() {
    const next = () => {
      const ref = this.getCurrentRef();
      !ref && this._displayConsole(`The Screen Ref is lost when calling onEndReached. Please confirm whether the Stack is working properly.(index: ${this.state.checkedIndex})`);
      !!ref && this.isClassCompoent(ref.constructor) ? ref && ref.onEndReached && typeof ref.onEndReached === 'function' && ref.onEndReached() : triggerEndReached(ref);
    };
    if (this.state.checkedIndex != null) {
      const { onBeforeEndReached } = this.props;
      onBeforeEndReached && typeof onBeforeEndReached === 'function' ? onBeforeEndReached(next) : next();
    }
  }

  _toggledRefreshing(status) {
    this.setState({
      isRefreshing: status ?? !this.state.isRefreshing
    });
  }

  _onRefresh() {
    const next = () => {
      const ref = this.getCurrentRef();
      !ref && this._displayConsole(`The Screen Ref is lost when calling onRefresh. Please confirm whether the Stack is working properly.(index: ${this.state.checkedIndex})`);
      if (ref) {
        this.isClassCompoent(ref.constructor) ? ref.onRefresh && typeof ref.onRefresh === 'function' && ref.onRefresh(this._toggledRefreshing) : triggerRefresh(ref, this._toggledRefreshing);
      } else {
        this._toggledRefreshing(false);
      }
    };
    const { onBeforeRefresh } = this.props;
    onBeforeRefresh && typeof onBeforeRefresh === 'function' ? onBeforeRefresh(next, this._toggledRefreshing) : next();
  }

  _renderHeader = isRender => {
    const { header } = this.props;
    return (
      header &&
      isRender && (
        <View
          onLayout={({ nativeEvent }) => {
            const { height } = nativeEvent.layout;
            this.layoutHeight['header'] = height;
            if (height !== 0) this._refresh();
          }}
        >
          {typeof header === 'function' ? header() : header}
        </View>
      )
    );
  };

  _renderStickyHeader = () => {
    const { stickyHeader } = this.props;
    return (
      stickyHeader && (
        <View
          onLayout={({ nativeEvent }) => {
            const { height } = nativeEvent.layout;
            this.layoutHeight['stickyHeader'] = height;
            if (height !== 0) this._refresh();
          }}
        >
          {typeof stickyHeader === 'function' ? stickyHeader() : stickyHeader}
        </View>
      )
    );
  };

  _renderTitle = () => {
    const { title, titleArgs } = this.props;
    if (!title) return null;
    const { style, interpolateHeight, interpolateOpacity } = titleArgs;
    return (
      <Animated.View
        style={[
          {
            height: this.scroll2VerticalPos.interpolate(Object.assign(this.titleInterpolateArgs.height, interpolateHeight)),
            opacity: this.scroll2VerticalPos.interpolate(Object.assign(this.titleInterpolateArgs.opacity, interpolateOpacity)),
            overflow: 'hidden'
          },
          style
        ]}
      >
        {typeof title === 'function' ? title() : title}
      </Animated.View>
    );
  };

  _refreshControl() {
    const ref = this.getCurrentRef();
    const enabled = !!(ref && ref.onRefresh) || refreshMap.has(ref);
    return <RefreshControl enabled={enabled} refreshing={this.state.isRefreshing} onRefresh={this._onRefresh} />;
  }

  _onScroll2Vertical(event) {
    const { onScroll } = this.props;
    // TODO...
    if (typeof onScroll === 'function' && event) onScroll(event);
  }

  _setScrollHandler2Vertical() {
    const { title } = this.props;
    const scrollEventConfig = {
      listener: this._onScroll2Vertical,
      // Error: Style property 'height' is not supported by native animated module, Maybe replaced with scaleX in the future.
      useNativeDriver: !title
    };
    const argMapping = [];
    argMapping.push({ nativeEvent: { contentOffset: { y: this.scroll2VerticalPos } } });
    this._onScrollHandler2Vertical = Animated.event(argMapping, scrollEventConfig);
  }

  _onScroll2Horizontal(event) {
    const { onScroll2Horizontal } = this.props;
    // TODO...
    if (typeof onScroll2Horizontal === 'function' && event) onScroll2Horizontal(event);
  }

  _setScrollHandler2Horizontal() {
    const scrollEventConfig = {
      listener: this._onScroll2Horizontal,
      useNativeDriver: true
    };
    const argMapping = [];
    argMapping.push({ nativeEvent: { contentOffset: { x: this.scroll2HorizontalPos } } });
    this._onScrollHandler2Horizontal = Animated.event(argMapping, scrollEventConfig);
  }

  render() {
    const { style, onEndReachedThreshold, fixedHeader, carouselProps, sectionListProps } = this.props;
    return (
      <View
        onLayout={({ nativeEvent }) => {
          const { height } = nativeEvent.layout;
          this.layoutHeight['container'] = height;
          if (height !== 0) this._refresh();
        }}
        style={[styles.container, style]}
      >
        {this._renderTitle()}
        <AnimatedSectionList
          ref={rf => (this.section = rf)}
          keyExtractor={(item, index) => `scrollable-tab-view-wrap-${index}`}
          renderSectionHeader={this._renderSectionHeader}
          onEndReached={this._onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          refreshControl={this._refreshControl()}
          sections={[{ data: [1] }]}
          stickySectionHeadersEnabled={true}
          ListHeaderComponent={this._renderHeader(!fixedHeader)}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={() => {
            return (
              <AnimatedCarousel
                pagingEnabled={true}
                inactiveSlideOpacity={1}
                inactiveSlideScale={1}
                data={this.stacks}
                renderItem={this._renderItem}
                sliderWidth={deviceWidth}
                itemWidth={deviceWidth}
                onScrollIndexChanged={this._throttleCallback}
                firstItem={this.state.checkedIndex}
                onScroll={this._onScrollHandler2Horizontal}
                {...carouselProps}
              />
            );
          }}
          onScrollToIndexFailed={() => {}}
          onScroll={this._onScrollHandler2Vertical}
          {...sectionListProps}
        ></AnimatedSectionList>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsStyle: { flex: 1, zIndex: 100, flexDirection: 'row', backgroundColor: '#ffffff', height: 35, marginBottom: -0.5 },
  tabStyle: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  textStyle: { height: 20, fontSize: 12, color: '#11111180', textAlign: 'center', lineHeight: 20 },
  tabUnderlineStyle: { height: 2, borderRadius: 2, backgroundColor: '#00aced' }
});
