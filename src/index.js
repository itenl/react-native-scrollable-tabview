import React from 'react';
import { StyleSheet, Text, View, SectionList, RefreshControl, TouchableOpacity, FlatList, Animated, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import Carousel from 'react-native-snap-carousel';
import HocComponent from './HocComponent';
const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

/**
 * @author itenl
 * @export
 * @class ScrollableTabView
 * @extends {React.Component}
 */
export default class ScrollableTabView extends React.Component {
  static propTypes = {
    stacks: PropTypes.array.isRequired,
    firstIndex: PropTypes.number,
    mappingProps: PropTypes.object,
    header: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    badges: PropTypes.array,
    tabsStyle: PropTypes.object,
    tabWrapStyle: PropTypes.object,
    tabInnerStyle: PropTypes.object,
    tabActiveOpacity: PropTypes.number,
    tabStyle: PropTypes.object,
    tabsEnableAnimated: PropTypes.bool,
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
    onScroll: PropTypes.func
  };

  static defaultProps = {
    stacks: [],
    firstIndex: 0,
    mappingProps: {},
    header: null,
    badges: [],
    tabsStyle: {},
    tabWrapStyle: {},
    tabInnerStyle: {},
    tabActiveOpacity: 0.6,
    tabStyle: {},
    tabsEnableAnimated: false,
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
    onScroll: null
  };

  constructor(props) {
    super(props);
    this.state = {
      checkedIndex: this._getFirstIndex(),
      refsObj: {},
      lazyIndexs: [this._getFirstIndex()],
      isRefreshing: false,
      sectionListScrollY: new Animated.Value(0),
      carouselScrollX: new Animated.Value(0)
    };
    this.tabsMeasurements = [];
    this.layoutHeight = {
      container: 0,
      header: 0,
      tabs: 0,
      screen: 0
    };
    this.interpolate = {
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
    this._initial();
  }

  componentWillReceiveProps(newProps) {
    this._initial(newProps, true);
  }

  _initial(props = this.props, isFix = false) {
    isFix && this._fixData(props);
    this.tabs = this._getTabs(props);
    this.badges = this._getBadges(props);
    this.stacks = this._getWrapChildren(props);
  }

  /**
   * 避免reset栈时的默认 firstIndex 超出当前选中索引导致无法显示视图
   * @param {*} props
   * @memberof ScrollableTabView
   */
  _fixData(props) {
    if (props.stacks && props.stacks.length && props.stacks.length != this.stacks.length && props.firstIndex != this.state.checkedIndex) {
      const timer = setTimeout(() => {
        this._onTabviewChange(props.firstIndex);
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
        if (item.screen && !item.screen.__HOCNAME__) {
          this._makeStacksID(item);
          item.screen = HocComponent(item.screen, this._setCurrentRef(index, item.__id__), index);
        }
        return item;
      })
    );
  }

  _setCurrentRef(index, id) {
    return ref => {
      if (this.state.refsObj[index] && this.state.refsObj[index] === ref) return;
      this.state.refsObj[index] = ref;
      this.setState({
        refsObj: this.state.refsObj
      });
    };
  }

  getCurrentRef(index) {
    return this.state.refsObj[index ?? this.state.checkedIndex];
  }

  toTabView = indexOrLabel => {
    switch (typeof indexOrLabel) {
      case 'number':
        this._onTabviewChange(indexOrLabel);
        break;
      case 'string':
        const tab = this.tabs.filter(f => f.tabLabel == indexOrLabel)[0];
        if (tab) {
          this._onTabviewChange(tab.index);
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
      this.section &&
        this.section.scrollToLocation({
          itemIndex: 0,
          viewOffset: 0 - y
        });
    }
  };

  _getFirstIndex() {
    return this.props.firstIndex ?? 0;
  }

  /**
   * 作为吸顶组件与Screen之间的桥梁，用于同步吸顶组件与Screen之间的状态
   * @memberof ScrollableTabView
   */
  _refresh = () => {
    this.setState({});
  };

  _getProps(props) {
    return Object.assign(
      {
        refresh: this._refresh,
        scrollTo: this._scrollTo,
        toTabView: this.toTabView,
        layoutHeight: this.layoutHeight
      },
      props || {}
    );
  }

  _renderSticky() {
    const stacks = this.props.stacks[this.state.checkedIndex];
    const ref = this.getCurrentRef();
    if (stacks && stacks.sticky && typeof stacks.sticky == 'function' && ref) {
      // 用于自动同步 Screen 数据流改变后仅会 render 自身 Screen 的问题，用于自动同步 screenContext 给吸顶组件
      if (this.props.syncToSticky && !ref.__isOverride__) {
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
    let badges = this.badges[tabIndex] || this.props.badges[tabIndex];
    if (badges && badges.length)
      return badges.map(item => {
        return item;
      });
    return null;
  }

  _measureTab(pageIndex, { nativeEvent }) {
    const { x, width, height } = nativeEvent.layout;
    this.tabsMeasurements[pageIndex] = { left: x, right: x + width, width, height };
  }

  _renderTab({ item, index }) {
    const { tabActiveOpacity, tabWrapStyle, tabInnerStyle, tabStyle, textStyle, textActiveStyle, tabUnderlineStyle, tabsEnableAnimated } = this.props;
    const _tabUnderlineStyle = Object.assign({ top: 6 }, styles.tabUnderlineStyle, tabUnderlineStyle);
    const checked = this.state.checkedIndex == index;
    return (
      <View onLayout={this._measureTab.bind(this, index)} key={index} style={tabWrapStyle}>
        {this._renderBadges(index)}
        <TouchableOpacity
          activeOpacity={tabActiveOpacity}
          onPress={() => {
            this._onTabviewChange(index);
          }}
          style={[styles.tabStyle, tabStyle]}
        >
          <View style={tabInnerStyle}>
            <Text style={[styles.textStyle, textStyle, checked && textActiveStyle]}>
              {item.tabLabelRender && typeof item.tabLabelRender == 'function' ? item.tabLabelRender(item.tabLabel) : item.tabLabel}
            </Text>
            {!tabsEnableAnimated && checked && <View style={_tabUnderlineStyle}></View>}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  _renderAnimatedTabUnderline(tabWidth) {
    const { useScroll, tabUnderlineStyle } = this.props;
    const _tabUnderlineStyle = Object.assign({ zIndex: 100, width: tabWidth, position: 'absolute' }, styles.tabUnderlineStyle, tabUnderlineStyle);
    if (!_tabUnderlineStyle.top && _tabUnderlineStyle.height) _tabUnderlineStyle.top = this.layoutHeight['tabs'] - _tabUnderlineStyle.height;
    // const index = this.state.checkedIndex;
    // const tabsMeasurements = this.tabsMeasurements[index];
    // const { left, right, width, height } = tabsMeasurements;
    return (
      <Animated.View
        style={[
          styles.tabUnderlineStyle,
          _tabUnderlineStyle,
          {
            transform: [
              {
                translateX: this.state.carouselScrollX.interpolate({
                  inputRange: [0, this.tabs.length * deviceWidth],
                  // if useScroll is True, will conflict with this.flatlist.scrollToIndex
                  outputRange: [0, useScroll ? this.tabs.length * tabWidth : deviceWidth]
                })
              }
            ]
          }
        ]}
      ></Animated.View>
    );
  }

  _renderTabs() {
    const { oneTabHidden, tabsShown, tabsStyle, tabStyle, useScroll, tabsEnableAnimated } = this.props;
    const { width } = tabStyle;
    if (tabsEnableAnimated && tabStyle && width == undefined) throw new Error('When tabsEnableAnimated is true, the width must be specified for tabStyle');
    const renderTab = !(oneTabHidden && this.tabs && this.tabs.length == 1) && tabsShown;
    const _tabsStyle = Object.assign({}, !useScroll && { alignItems: 'center', justifyContent: 'space-around' }, styles.tabsStyle, tabsStyle);
    this.layoutHeight['tabs'] = renderTab ? _tabsStyle.height : 0;
    return (
      renderTab &&
      this.tabs &&
      !!this.tabs.length &&
      (useScroll ? (
        <View>
          <FlatList
            ref={rf => (this.flatlist = rf)}
            data={this.tabs}
            renderItem={this._renderTab.bind(this)}
            style={_tabsStyle}
            horizontal={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `scrollable-tab-view-wrap-tab-${index}`}
          ></FlatList>
          {tabsEnableAnimated && this._renderAnimatedTabUnderline(width)}
        </View>
      ) : (
        <View style={_tabsStyle}>
          {this.tabs.map((tab, index) => this._renderTab({ item: tab, index }))}
          {tabsEnableAnimated && this._renderAnimatedTabUnderline(width)}
        </View>
      ))
    );
  }

  _renderSectionHeader() {
    return (
      <View style={{ flex: 1 }}>
        {this.props.fixedHeader && this._renderHeader()}
        {this._renderTabs()}
        {this._renderSticky()}
      </View>
    );
  }

  _snapToItem = index => {
    return this.tabview && this.tabview.snapToItem(index);
  };

  _onTabviewChange(index) {
    const { toHeaderOnTab, toTabsOnTab, onTabviewChanged, useScroll } = this.props;
    if (index == this.state.checkedIndex) {
      if (toHeaderOnTab) return this._scrollTo(-this.layoutHeight['header']);
      if (toTabsOnTab) return this._scrollTo(0);
      return void 0;
    }
    if (!this.state.lazyIndexs.includes(index)) this.state.lazyIndexs.push(index);
    this.setState(
      {
        checkedIndex: index,
        lazyIndexs: this.state.lazyIndexs
      },
      () => {
        if (onTabviewChanged) {
          const tab = this.tabs[this.state.checkedIndex];
          onTabviewChanged(this.state.checkedIndex, tab && tab.tabLabel);
        }
      }
    );
    this._snapToItem(index);
    if (useScroll && this.flatlist)
      this.flatlist.scrollToIndex({
        index: index
      });

    // 切换后强制重置刷新状态
    this._toggledRefreshing(false);
  }

  _getLazyIndexs(index) {
    if (this.state.lazyIndexs.includes(index)) return true;
  }

  _getScreenHeight() {
    this.layoutHeight['screen'] = this.layoutHeight['container'] - (this.layoutHeight['header'] + this.layoutHeight['tabs']);
    return this.layoutHeight['screen'];
  }

  _getMaximumScreenHeight() {
    return this.layoutHeight['container'] - this.layoutHeight['tabs'];
  }

  _renderItem({ item, index }) {
    const screenHeight = this._getScreenHeight();
    return (
      (this.props.enableCachePage ? this.props.enableCachePage : this.state.checkedIndex == index) &&
      (this.getCurrentRef(index) || this.getCurrentRef(index) == undefined) &&
      this._getLazyIndexs(index) && (
        <View
          style={[
            { flex: 1 },
            this.props.enableCachePage && this.state.checkedIndex != index && { maxHeight: screenHeight },
            this.props.enableCachePage && this.state.checkedIndex == index && this.props.fillScreen && { minHeight: screenHeight },
            this.props.enableCachePage && this.state.checkedIndex == index && this.props.fixedTabs && { minHeight: this._getMaximumScreenHeight() },
            !this.props.enableCachePage && this.state.checkedIndex == index && { minHeight: screenHeight }
          ]}
        >
          <item.screen {...this._getProps(this.props.mappingProps)} {...(item.toProps || {})} />
        </View>
      )
    );
  }

  _onEndReached() {
    const next = () => {
      const ref = this.getCurrentRef();
      if (ref && ref.onEndReached && typeof ref.onEndReached == 'function') ref.onEndReached();
    };
    const { onBeforeEndReached } = this.props;
    onBeforeEndReached && typeof onBeforeEndReached === 'function' ? onBeforeEndReached(next) : next();
  }

  _toggledRefreshing(status) {
    this.setState({
      isRefreshing: status ?? !this.state.isRefreshing
    });
  }

  _onRefresh() {
    const next = () => {
      const ref = this.getCurrentRef();
      if (ref && ref.onRefresh && typeof ref.onRefresh == 'function') ref.onRefresh(this._toggledRefreshing.bind(this));
    };
    const { onBeforeRefresh } = this.props;
    onBeforeRefresh && typeof onBeforeRefresh === 'function' ? onBeforeRefresh(next, this._toggledRefreshing.bind(this)) : next();
  }

  _renderHeader = () => {
    const { header } = this.props;
    return (
      header && (
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

  _renderTitle = () => {
    const { title, titleArgs } = this.props;
    const { style, interpolateHeight, interpolateOpacity } = titleArgs;
    return (
      <Animated.View
        style={[
          {
            height: this.state.sectionListScrollY.interpolate(Object.assign(this.interpolate.height, interpolateHeight)),
            opacity: this.state.sectionListScrollY.interpolate(Object.assign(this.interpolate.opacity, interpolateOpacity))
          },
          style
        ]}
      >
        {typeof title === 'function' ? title() : title}
      </Animated.View>
    );
  };

  render() {
    return (
      <View
        onLayout={({ nativeEvent }) => {
          const { height } = nativeEvent.layout;
          this.layoutHeight['container'] = height;
          if (height !== 0) this._refresh();
        }}
        style={[styles.container, this.props.style]}
      >
        {!!this.props.title && this._renderTitle()}
        <SectionList
          ref={rf => (this.section = rf)}
          keyExtractor={(item, index) => `scrollable-tab-view-wrap-${index}`}
          renderSectionHeader={this._renderSectionHeader.bind(this)}
          onEndReached={this._onEndReached.bind(this)}
          onEndReachedThreshold={this.props.onEndReachedThreshold}
          refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh.bind(this)} />}
          sections={[{ data: [1] }]}
          stickySectionHeadersEnabled={true}
          ListHeaderComponent={!this.props.fixedHeader && this._renderHeader()}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={() => {
            return (
              <Carousel
                ref={c => (this.tabview = c)}
                inactiveSlideScale={1}
                data={this.stacks}
                renderItem={this._renderItem.bind(this)}
                sliderWidth={deviceWidth}
                itemWidth={deviceWidth}
                onBeforeSnapToItem={index => {
                  this._onTabviewChange(index);
                }}
                firstItem={this.state.checkedIndex}
                getItemLayout={(data, index) => ({
                  length: deviceWidth,
                  offset: deviceWidth * index,
                  index
                })}
                onScroll={
                  this.props.tabsEnableAnimated &&
                  Animated.event(
                    [
                      {
                        nativeEvent: { contentOffset: { x: this.state.carouselScrollX } }
                      }
                    ],
                    {
                      // listener: ({ nativeEvent }) => {
                      //   console.log(nativeEvent.contentOffset.x);
                      // },
                      // If useNativeDriver is True, the listener cannot be triggered
                      useNativeDriver: true
                    }
                  )
                }
                {...this.props.carouselProps}
              />
            );
          }}
          onScrollToIndexFailed={() => {}}
          onScroll={
            !!this.props.title
              ? Animated.event(
                  [
                    {
                      nativeEvent: { contentOffset: { y: this.state.sectionListScrollY } }
                    }
                  ],
                  {
                    listener: !!this.props.onScroll && this.props.onScroll.bind(this),
                    useNativeDriver: false
                  }
                )
              : !!this.props.onScroll
              ? this.props.onScroll.bind(this)
              : null
          }
          {...this.props.sectionListProps}
        ></SectionList>
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
