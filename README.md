# react-native-scrollable-tabview

[![NPM Version](http://img.shields.io/npm/v/@itenl/react-native-scrollable-tabview.svg?style=flat)](https://www.npmjs.com/package/@itenl/react-native-scrollable-tabview)

```javascript
const render = () => {
  return (
    <ScrollableTabView
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
          // 吸顶类组件 / 函数组件
          // 类组件可吸顶组件，需用函数包括，实例内将返回该类组件的上下文
          sticky: Sticky,
          // toProps 仅传递给 Screen，不作数据关联
          toProps: {
            xx: 123,
          },
        },
      ]}
      tabsStyle={{}}
      tabStyle={{}}
      textStyle={{}}
      textActiveStyle={{}}
      tabUnderlineStyle={{}}
      firstIndex={0}
      syncToSticky={true}
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

-------------------