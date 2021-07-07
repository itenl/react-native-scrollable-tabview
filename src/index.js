import React from 'react';
import { StyleSheet, Text, View, SectionList, RefreshControl, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Carousel from 'react-native-snap-carousel';
import { Dimensions, PixelRatio } from 'react-native';
import HocComponent from './HocComponent';
const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

/**
 *  该组件内禁止再次嵌套 SectionList / FlatList / ScrollView 等类似组件
 *  Screen 内上下文将提供 onRefresh(toggled) / onEndReached 方法用于方便触发对应业务，其中 toggled 用于切换loading状态，可传指定true/false参数，不传将默认与上个状态进行切换
 *  for - Value
 * @export
 * @class ScrollableTabView
 * @extends {React.Component}
 */
export default class ScrollableTabView extends React.Component {
  static propTypes = {
    stacks: PropTypes.array.isRequired,
    firstIndex: PropTypes.number,
    mappingProps: PropTypes.object,
    header: PropTypes.function,
    badges: PropTypes.array,
    tabsStyle: PropTypes.object,
    tabWrapStyle: PropTypes.object,
    tabStyle: PropTypes.object,
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
  };

  static defaultProps = {
    stacks: [],
    firstIndex: 0,
    mappingProps: {},
    header: null,
    badges: [],
    tabsStyle: {},
    tabWrapStyle: {},
    tabStyle: {},
    textStyle: {},
    textActiveStyle: {},
    tabUnderlineStyle: {},
    syncToSticky: true,
    onEndReachedThreshold: 0.2,
    onBeforeRefresh: null,
    onBeforeEndReached: null,
    onTabviewChanged: null,
    oneTabHidden: false,
    enableCachePage: false,
    carouselProps: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      checkedIndex: this._getFirstIndex(),
      refsObj: {},
      lazyIndexs: [this._getFirstIndex()],
      isRefreshing: false,
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
      this._onTabviewChange(props.firstIndex);
    }
  }

  _getTabs(props) {
    return (
      props.stacks &&
      props.stacks.map((item, index) => {
        return {
          tabLabel: item.tabLabel || item.screen?.name,
          tabLabelRender: item.tabLabelRender ?? null,
          index,
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

  _getWrapChildren(props) {
    return (
      props.stacks &&
      props.stacks.map((item, index) => {
        if (item.screen && item.screen.name && item.screen.name != 'HocComponent') item.screen = HocComponent(item.screen, this._setCurrentRef(index), index);
        return item;
      })
    );
  }

  _setCurrentRef(index) {
    return ref => {
      this.state.refsObj[index] = ref;
      this.setState({
        refsObj: this.state.refsObj,
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
          viewOffset: 0 - y,
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
      },
      props || {},
    );
  }

  _renderSticky() {
    const stacks = this.props.stacks[this.state.checkedIndex];
    const ref = this.getCurrentRef();
    if (stacks && stacks.sticky && typeof stacks.sticky == 'function' && ref) {
      // 用于自动同步 Screen 数据流改变后仅会 render 自身 Screen 的问题，用于自动同步 context 给吸顶组件
      if (this.props.syncToSticky) {
        ref.componentDidUpdate = () => {
          this._refresh();
        };
      }
      return <stacks.sticky {...this._getProps(this.props.mappingProps || {})} context={ref}></stacks.sticky>;
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

  _renderTabs() {
    const renderTab = !(this.props.oneTabHidden && this.tabs && this.tabs.length == 1);
    return (
      <View style={{ flex: 1 }}>
        {renderTab && (
          <View style={[styles.tabsStyle, this.props.tabsStyle]}>
            {this.tabs &&
              this.tabs.map((tab, index) => {
                const checked = this.state.checkedIndex == index;
                return (
                  <View key={index} style={this.props.tabWrapStyle}>
                    {this._renderBadges(index)}
                    <TouchableOpacity
                      onPress={() => {
                        this._onTabviewChange(index);
                      }}
                      style={[styles.tabStyle, this.props.tabStyle]}
                    >
                      <View>
                        <Text style={[styles.textStyle, this.props.textStyle, checked && this.props.textActiveStyle]}>
                          {tab.tabLabelRender && typeof tab.tabLabelRender == 'function' ? tab.tabLabelRender(tab.tabLabel) : tab.tabLabel}
                        </Text>
                        {checked && <View style={[styles.tabUnderlineStyle, this.props.tabUnderlineStyle]}></View>}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
          </View>
        )}
        {this._renderSticky()}
      </View>
    );
  }

  _snapToItem = index => {
    this.tabview && this.tabview.snapToItem(index);
  };

  _onTabviewChange(index, callback = this._snapToItem) {
    if (index == this.state.checkedIndex) return;
    if (!this.state.lazyIndexs.includes(index)) this.state.lazyIndexs.push(index);
    this.setState(
      {
        checkedIndex: index,
        lazyIndexs: this.state.lazyIndexs,
      },
      () => {
        if (this.props.onTabviewChanged) {
          const tab = this.tabs[this.state.checkedIndex];
          this.props.onTabviewChanged(this.state.checkedIndex, tab && tab.tabLabel);
        }
      },
    );
    callback && callback(index);
    // 切换后强制重置刷新状态
    this._toggledRefreshing(false);
  }

  _getLazyIndexs(index) {
    if (this.state.lazyIndexs.includes(index)) return true;
  }

  _renderItem({ item, index }) {
    return (
      (this.getCurrentRef(index) || this.getCurrentRef(index) == undefined) &&
      this._getLazyIndexs(index) &&
      (this.props.enableCachePage ? this.props.enableCachePage : this.state.checkedIndex == index) && (
        <View style={[{ flex: 1 }, this.props.enableCachePage && this.state.checkedIndex != index && { height: 0 }]}>
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
      isRefreshing: status ?? !this.state.isRefreshing,
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

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <SectionList
          ref={rf => (this.section = rf)}
          keyExtractor={(item, index) => `scrollable-tab-view-wrap-${index}`}
          renderSectionHeader={this._renderTabs.bind(this)}
          onEndReached={this._onEndReached.bind(this)}
          onEndReachedThreshold={this.props.onEndReachedThreshold}
          refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh.bind(this)} />}
          sections={[{ data: [1] }]}
          stickySectionHeadersEnabled={true}
          ListHeaderComponent={this.props.header ?? null}
          renderItem={() => {
            return (
              <Carousel
                ref={c => (this.tabview = c)}
                inactiveSlideScale={1}
                data={this.stacks}
                renderItem={this._renderItem.bind(this)}
                sliderWidth={deviceWidth}
                itemWidth={deviceWidth}
                onSnapToItem={index => {
                  this._onTabviewChange(index, null);
                }}
                firstItem={this.state.checkedIndex}
                getItemLayout={(data, index) => ({
                  length: deviceWidth,
                  offset: deviceWidth * index,
                  index,
                })}
                {...this.props.carouselProps}
              />
            );
          }}
        ></SectionList>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsStyle: { flex: 1, zIndex: 100, flexDirection: 'row', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'space-around', height: 35 },
  tabStyle: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfcfc' },
  textStyle: { height: 20, fontSize: 12, color: '#11111180', textAlign: 'center' },
  tabUnderlineStyle: { top: 6, height: 2, borderRadius: 2, backgroundColor: '#00aced' },
});
