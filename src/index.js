import React from 'react';
import { StyleSheet, Text, View, SectionList, RefreshControl, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Carousel from 'react-native-snap-carousel';
import { Dimensions, PixelRatio } from 'react-native';
import HocComponent from './HocComponent';
const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

/**
 *  ScrollableTabView
 *  该组件内禁止再次嵌套 SectionList / FlatList / ScrollView 等类似组件
 *  Screen 内上下文将提供 onRefresh(toggled) / onEndReached 方法用于方便触发对应业务，其中 toggled 用于切换loading状态，可传指定true/false参数，不传将默认与上个状态进行切换
 *  for - Value
 *  */
export default class ScrollableTabView extends React.Component {
  static propTypes = {
    stacks: PropTypes.array.isRequired,
    firstIndex: PropTypes.number,
    mappingProps: PropTypes.object,
    header: PropTypes.function,
    badges: PropTypes.array,
    tabsStyle: PropTypes.object,
    tabStyle: PropTypes.object,
    textStyle: PropTypes.object,
    textActiveStyle: PropTypes.object,
    tabUnderlineStyle: PropTypes.object,
  };

  static defaultProps = {
    stacks: [],
    firstIndex: 0,
    mappingProps: {},
    header: null,
    badges: [],
    tabsStyle: {},
    tabStyle: {},
    textStyle: {},
    textActiveStyle: {},
    tabUnderlineStyle: {},
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
    this.stacks = this._getWrapChildren(props);
  }

  // 避免reset栈时的默认 firstIndex 超出当前选中索引导致无法显示视图
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
          index,
        };
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

  _getCurrentRef(index) {
    return this.state.refsObj[index ?? this.state.checkedIndex];
  }

  _getFirstIndex() {
    return this.props.firstIndex ?? 0;
  }

  // 作为吸顶组件与Screen之间的桥梁，用于同步吸顶组件与Screen之间的状态
  _refresh = () => {
    this.setState({});
  };

  _getProps(props) {
    return Object.assign(
      {
        refresh: this._refresh,
      },
      props || {},
    );
  }

  _renderSticky() {
    const stacks = this.props.stacks[this.state.checkedIndex];
    const ref = this._getCurrentRef();
    if (stacks && stacks.sticky && typeof stacks.sticky == 'function' && ref) {
      // 用于自动同步 Screen 数据流改变后仅会 render 自身 Screen 的问题，用于自动同步 context 给吸顶组件
      // ref.componentDidUpdate = () => {
      //   this._refresh();
      // };
      return <stacks.sticky {...this._getProps(this.props.mappingProps || {})} context={ref}></stacks.sticky>;
    }
    return null;
  }

  _renderBadges(tabIndex) {
    let badges = this.props.badges[tabIndex];
    if (badges && badges.length)
      return badges.map(item => {
        return item;
      });
    return null;
  }

  _renderTabs() {
    return (
      <View style={{ flex: 1 }}>
        <View style={[{ flex: 1, zIndex: 100, flexDirection: 'row', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'space-around', height: 35 }, this.props.tabsStyle]}>
          {this.tabs &&
            this.tabs.map((tab, index) => {
              const checked = this.state.checkedIndex == index;
              return (
                <View key={index} style={{ flex: 1 }}>
                  {this._renderBadges(index)}
                  <TouchableOpacity
                    onPress={() => {
                      this._onTabviewChange(index);
                    }}
                    style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfcfc' }, this.props.tabStyle]}
                  >
                    <View>
                      <Text
                        style={[
                          {
                            height: 20,
                            fontSize: 12,
                            color: '#11111180',
                            textAlign: 'center',
                          },
                          this.props.textStyle,
                          checked && this.props.textActiveStyle,
                        ]}
                      >
                        {tab.tabLabel}
                      </Text>
                      {checked && (
                        <View
                          style={[
                            {
                              top: 6,
                              height: 2,
                              borderRadius: 2,
                              backgroundColor: '#00aced',
                            },
                            this.props.tabUnderlineStyle,
                          ]}
                        ></View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
        {this._renderSticky()}
      </View>
    );
  }

  _snapToItem = index => {
    this.tabview && this.tabview.snapToItem(index);
  };

  _onTabviewChange(index, callback = this._snapToItem) {
    if (!this.state.lazyIndexs.includes(index)) this.state.lazyIndexs.push(index);
    this.setState({
      checkedIndex: index,
      lazyIndexs: this.state.lazyIndexs,
    });
    callback && callback(index);
    // 切换后强制重置刷新状态
    this._toggledRefreshing(false);
  }

  _getLazyIndexs(index) {
    if (this.state.lazyIndexs.includes(index)) return true;
  }

  _renderItem({ item, index }) {
    return (
      (this._getCurrentRef(index) || this._getCurrentRef(index) == undefined) &&
      this._getLazyIndexs(index) &&
      this.state.checkedIndex == index && (
        <View style={{ flex: 1 }}>
          <item.screen {...this._getProps(this.props.mappingProps)} {...(item.toProps || {})} />
        </View>
      )
    );
  }

  _onEndReached() {
    const ref = this._getCurrentRef();
    if (ref && ref.onEndReached && typeof ref.onEndReached == 'function') ref.onEndReached();
  }

  _toggledRefreshing(status) {
    this.setState({
      isRefreshing: status ?? !this.state.isRefreshing,
    });
  }

  _onRefresh() {
    const ref = this._getCurrentRef();
    if (ref && ref.onRefresh && typeof ref.onRefresh == 'function') ref.onRefresh(this._toggledRefreshing.bind(this));
  }

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <SectionList
          keyExtractor={(item, index) => `scrollable-tab-view-wrap-${index}`}
          renderSectionHeader={this._renderTabs.bind(this)}
          onEndReached={this._onEndReached.bind(this)}
          onEndReachedThreshold={1}
          refreshControl={<RefreshControl refreshing={this.state.isRefreshing} onRefresh={this._onRefresh.bind(this)} />}
          sections={[{ data: [1] }]}
          stickySectionHeadersEnabled={true}
          ListHeaderComponent={this.props.header ?? null}
          renderItem={() => {
            return (
              <Carousel
                ref={c => {
                  this.tabview = c;
                }}
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
              />
            );
          }}
        ></SectionList>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// // 调用 Demo
// // 栈
// const stacks = [
//   {
//     // TabView 类组件 / 函数组件
//     screen: One,
//     // 吸顶类组件 / 函数组件
//     // 类组件可吸顶组件，需用函数包括，实例内将返回该类组件的上下文
//     sticky: sticky,
//     // toProps 仅传递给 Screen，不作数据关联
//     toProps: {
//        xx: 123，
//     },
//     tab: {
//       // 徽章
//       badges: (
//         <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
//           <Text>new</Text>
//         </View>
//       ),
//       // tab昵称
//       label: 'one',
//       // 对应单个的tab 文本样式
//       // textStyle: { fontSize: 18 },
//       // 对应单个的tab 容器样式
//       // style: { backgroundColor: 'red' },
//     },
//   },
// ];

// const render = () => {
//   return (
//     <ScrollableTabView
//       // 栈
//       stacks={stacks}
//       // 用于在 最外层异步数据同步给各Screen与吸顶组件
//       mappingProps={{ xx: this.state.xxx }}
//       // 整个tab容器样式
//       tabsStyle={{ height: 40 }}
//       // 头部组件
//       header={() => {
//         return (
//           <View>
//             <Text>Top</Text>
//           </View>
//         );
//       }}
//     ></ScrollableTabView>
//   );
// };
