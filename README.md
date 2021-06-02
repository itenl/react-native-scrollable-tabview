# react-native-scrollable-tabview

[![NPM Version](http://img.shields.io/npm/v/@itenl/react-native-scrollable-tabview.svg?style=flat)](https://www.npmjs.com/package/@itenl/react-native-scrollable-tabview)


```javascript

// 调用 Demo
// 栈
const stacks = [
  {
    // TabView 类组件 / 函数组件
    screen: One,
    // 吸顶类组件 / 函数组件
    // 类组件可吸顶组件，需用函数包括，实例内将返回该类组件的上下文
    sticky: sticky,
    tab: {
      // 徽章
      badges: (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text>new</Text>
        </View>
      ),
      // tab昵称
      label: 'one',
      // 对应单个的tab 文本样式
      // textStyle: { fontSize: 18 },
      // 对应单个的tab 容器样式
      // style: { backgroundColor: 'red' },
    },
  },
];

const render = () => {
  return (
    <ScrollableTabView
      // 栈
      stacks={stacks}
      // 用于在 最外层异步数据同步给各Screen与吸顶组件
      mappingProps={{ xx: this.state.xxx }}
      // 整个tab容器样式
      tabsStyle={{ height: 40 }}
      // 头部组件
      header={() => {
        return (
          <View>
            <Text>Top</Text>
          </View>
        );
      }}
    ></ScrollableTabView>
  );
};


```
