# react-native-scrollable-tabview

[![NPM Version](http://img.shields.io/npm/v/@itenl/react-native-scrollable-tabview.svg?style=flat)](https://www.npmjs.com/package/@itenl/react-native-scrollable-tabview)

```javascript
// 1. 在 Stacks 中每个 Screen 将提供 onRefresh(toggled) / onEndReached 函数
// 2. 通过 mappingProps 传递的数据将映射结构到 Screen / Sticky
// 3. 在 Sticky 中可通过 this.props.context 来获取 Screen 的上下文

// 获取当前激活的 Screen 实例上下文
this.scrollableTabView.getCurrentRef();

const render = () => {
  return (
    <ScrollableTabView
      ref={rf => (this.scrollableTabView = rf)}
      // 关联映射数据到 Stack / Sticky
      mappingProps={{
        fromRootEst: this.state.est,
      }}
      // 针对每个Tab的徽章
      badges={[
        null,
        [
          <View
            style={{
              position: 'absolute',
              zIndex: 100,
              top: 10,
              right: 0,
            }}
          >
            <Text>new</Text>
          </View>,
          <View
            style={{
              position: 'absolute',
              width: 150,
              height: 50,
              zIndex: 100,
              marginTop: 35,
              right: 0,
              opacity: 0.6,
              backgroundColor: 'pink',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text>Three Tips</Text>
          </View>,
        ],
      ]}
      // 栈数组
      stacks={[
        {
          // TabView 类组件 / 函数组件
          screen: One,
          // 吸顶 类组件 / 函数组件 实例内将返回该类组件的上下文
          sticky: Sticky,
          // Tab 昵称
          tabLabel: 'OneTab',
          // 针对当前 Tab 的徽章，与 badges 属性互斥
          badge: [<Text>one</Text>, <Text>two</Text>],
          // toProps 仅传递给 Screen，不作数据关联
          toProps: {
            xx: 123,
          },
        },
      ]}
      // 整个Tabs包装样式
      tabsStyle={{}}
      // 单个Tab样式控制
      tabStyle={{}}
      // tab内文本样式
      textStyle={{}}
      // 选中激活的text样式
      textActiveStyle={{}}
      // 选中激活的下划线样式
      tabUnderlineStyle={{}}
      // 默认选中index
      firstIndex={0}
      // 是否同步(在screen中发生render触发componentDidUpdate将更新sticky)
      syncToSticky={true}
      // 触底回调阈值
      onEndReachedThreshold={0.1}
      // 下拉刷新前置函数
      onBeforeRefresh={(next, toggled) => {
        // 切换loading 可传 true / false 进行指定
        toggled();
        // 下一步执行 screen 中的 onRefresh 函数进行视图自身逻辑
        next();
      }}
      // 上滑加载更多前置函数
      onBeforeEndReached={next => {
        // 下一步执行 screen 中的 onEndReached 函数进行视图自身逻辑
        next();
      }}
      // Tab切换完成回调
      onTabviewChanged={index => {
        // 当前索引
        alert(index);
      }}
      // 顶部组件
      header={() => {
        return <View style={{ backgroundColor: 'pink', height: 120 }}></View>;
      }}
    ></ScrollableTabView>
  );
};
```

## Snapshot

<img src="./snapshot/qoz8r-klpuc.gif" />
<br />

---
