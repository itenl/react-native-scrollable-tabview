# react-native-scrollable-tabview

[![NPM Version](http://img.shields.io/npm/v/@itenl/react-native-scrollable-tabview.svg?style=flat)](https://www.npmjs.com/package/@itenl/react-native-scrollable-tabview)

```javascript
// · 在 Stacks 中每个 Screen 将提供 onRefresh(toggled) / onEndReached 函数
// · 通过 mappingProps 传递的数据将映射结构到 Screen / Sticky
// · 在 Sticky 中可通过 this.props.screenContext 来获取 Screen 的上下文
// · 在 Screen 中默认提供 this.props.refresh() / this.props.scrollTo(0) 函数

// 获取当前激活的 Screen 实例上下文
this.scrollableTabView.getCurrentRef();

// Screen 注入的生命周期
// 1.下拉刷新时触发 形参toggled函数用于切换原生loading状态的显隐，若在loading中用户切换tab将会强制隐藏并重置状态
//  onRefresh(toggled){}
// 2.上滑加载更多触发
//  onEndReached(){}

// Sticky this.props 注入的方法/属性
// 1.获取 Screen 上下文
//  this.props.screenContext

// Screen this.props 注入的方法/属性
// 1.方法：手动触发刷新、同步Screen状态至Sticky
//  this.props.refresh(无参数)
// 2.方法：上下滑动至指定位置
//  this.props.scrollTo(传入 0 默认定位至 tabs / 传入负数则置顶)
// 3.方法：跳转至其他 Tab
//  this.props.toTabView(可传入 index 或 tabLabel)
// 4.属性 获取 layoutHeight 对象
//  容器总高度
//  this.props.layoutHeight.container
//  顶部header高度
//  this.props.layoutHeight.header
//  tabs高度
//  this.props.layoutHeight.tabs
//  视图高度
//  this.props.layoutHeight.screen

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
          // 自定义 Tab渲染函数，优先级高于 tabLabel
          tabLabelRender: tabLabel => {
            return `--- ${tabLabel} ---`;
          },
          // 针对当前 Tab 的徽章，与 badges 属性互斥，优先级高于最外层属性 badges
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
      // 仅一个Tab时将隐藏自身
      oneTabHidden={true}
      // 是否持久化页面切换后不销毁
      enableCachePage={true}
      // 传递给 Carousel 的属性
      // 参照文档 https://github.com/meliorence/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md
      carouselProps={{}}
      // 传递给 SectionList 的属性
      // 参照文档 https://reactnative.cn/docs/sectionlist
      sectionListProps={{}}
      // 触发已激活的Tab将回到Header(高优先级)
      toHeaderOnTab={true}
      // 触发已激活的Tab将回到Tabs
      toTabsOnTab={true}
      // 配置 Tabs 显示隐藏
      tabsShown={false}
      // 在enableCachePage为true的情况下滑动切换Screen设置最小高度保障Header与Tabs不会弹跳
      fixedTabs={false}
    ></ScrollableTabView>
  );
};
```

## Snapshot

<img src="./snapshot/qoz8r-klpuc.gif" />
<br />

---
