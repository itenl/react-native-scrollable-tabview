# react-native-scrollable-tabview

[![NPM Version](http://img.shields.io/npm/v/@itenl/react-native-scrollable-tabview.svg?style=flat)](https://www.npmjs.com/package/@itenl/react-native-scrollable-tabview)

English | [简体中文](./README-zh_CN.md)

Based on pure `JS` scripts, without relying on native, no need for `react-native link`,`Title` / `Header` / `Tabs` / `Sticky` / `Screen` components can be flexibly configured, among which `Tabs` / `Sticky` can slide When it reaches the top, it will be topped; what we support is to independently manage its own `Sticky` / `Screen` / `Badge` / `tabLabel` configuration in the form of a stack, and inject the `Screen` [lifecycle](#InjectionLifecycle) `onRefresh` / `onEndReached` They will be triggered when the pull-down refresh and the scroll bar hit the bottom, and finally inject more into `Screen` / `Sticky` [props](#InjectionScreenProps)

##### Table of Contents
* [Example-API](https://github.com/itenl/react-native-scrollable-tabview-example-app)
* [Example-TikTok](https://github.com/itenl/react-native-scrollable-tabview-example-tiktok)
* [Features](#features)
* [Installation](#installation)
* [Usage](#usage)
* [Props](#props)
* [Method](#method)
* [Stack Property](#StackProperty)
* [Badge Property](#BadgeProperty)
* [Injection lifecycle to Screen](#InjectionLifecycle)
* [Injection props to Screen](#InjectionScreenProps)
* [Injection props to Sticky](#InjectionStickyProps)
* [Known Issues](#KnownIssues)
* [Snapshot](#Snapshot)

## <a name="features"/>Features
* Support to individually set pull-down refresh and up-slide load for each screen (life cycle injection form)
* Flex Tabs and multiple Tabs horizontal scrolling support configuration method
* Allow to set up each Screen’s own Sticky component
* Custom badges can be configured for each Tab
* Support pull down to refresh and slide up to load more pre-functions `onBeforeRefresh` / `onBeforeEndReached` 
* Support animation title, can support animation as `interpolate.opacity` and `interpolate.height`

## <a name="installation"/>Installation

```shell
npm i @itenl/react-native-scrollable-tabview
```
or
```shell
yarn add @itenl/react-native-scrollable-tabview
```

## <a name="usage"/>Usage

```jsx
import React from 'react';
import ScrollableTabView from '@itenl/react-native-scrollable-tabview';

function App() {
  return (
      <ScrollableTabView
        ref={rf => (this.scrollableTabView = rf)}
        mappingProps={{
          fromRootEst: this.state.est,
        }}
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
        stacks={[
          {
            screen: One,
            sticky: Sticky,
            tabLabel: 'OneTab',
            tabLabelRender: tabLabel => {
              return `--- ${tabLabel} ---`;
            },
            badge: [<Text>one</Text>, <Text>two</Text>],
            toProps: {
              xx: 123,
            },
          },
        ]}
        tabsStyle={{}}
        tabWrapStyle={{}}
        tabInnerStyle={{}}
        tabActiveOpacity={0.6}
        tabStyle={{}}
        textStyle={{}}
        textActiveStyle={{}}
        tabUnderlineStyle={{}}
        firstIndex={0}
        syncToSticky={true}
        onEndReachedThreshold={0.1}
        onBeforeRefresh={(next, toggled) => {
          toggled();
          next();
        }}
        onBeforeEndReached={next => {
          next();
        }}
        onTabviewChanged={index => {
          alert(index);
        }}
        header={() => {
          return <View style={{ backgroundColor: 'pink', height: 120 }}></View>;
        }}
        oneTabHidden={true}
        enableCachePage={true}
        carouselProps={{}}
        sectionListProps={{}}
        toHeaderOnTab={true}
        toTabsOnTab={true}
        tabsShown={false}
        fixedTabs={false}
        fixedHeader={false}
        useScroll={false}
        fillScreen={true}
      ></ScrollableTabView>
  );
}
```

## <a name="props"/>Props

All props are optional

Prop              | Type     | Default     | Description
----------------- | -------- | ----------- | -----------
**`stacks`**            | Array    | []          | Page Stack < [Read Stack Property](#StackProperty) >
**`mappingProps`**      | Object   | {}          | Associate mapping data to Stack / Sticky
**`badges`**             | Array    | []          | Badges for each Tab < [Read Badge Property](#BadgeProperty) >
**`tabsStyle`**             | Object    | {}          | The entire Tabs style
**`tabWrapStyle`**             | Object / Function    | {}          | Single Tab wrap style (The function parameters provide item, index, and need to return the style object, eg. **`return index == 1 && {zIndex: 10}`**)
**`tabInnerStyle`**             | Object    | {}          | Single Tab inner style
**`tabActiveOpacity`**             | Number    | 0.6          | Transparency after Tab button click
**`tabStyle`**             | Object    | {}          | Single Tab style
**`textStyle`**             | Object    | {}          | Text style in Tab
**`textActiveStyle`**             | Object    | {}          | Select the active text style
**`tabUnderlineStyle`**             | Object    | {}          | Select the active underline style
**`firstIndex`**             | Number / Null    | null          | Set the stack of **`firstIndex`** to active (make sure that the number of **`stacks`** is greater than to **`firstIndex`** when setting the **`firstIndex`** value)
**`syncToSticky`**             | Boolean    | true          | Whether it is synchronized (**`render`** triggered in the Screen **`componentDidUpdate`** will update Sticky)
**`onEndReachedThreshold`**             | Number    | 0.2          | Bottom callback threshold
**`onBeforeRefresh`**             | Function    | null          | Pull down to refresh the pre-functions, execute **`next`** to execute **`onRefresh`** function in Screen, execute **`toggled`** to switch system loading, you can pass true / false to specify (callback contains **`next`**, **`toggled`** two formal parameters)
**`onBeforeEndReached`**             | Function    | null          | Slide up to load more pre-functions, execute next will execute the **`onEndReached`** function in the Screen (callback contains **`next`** formal parameters)
**`onTabviewChanged`**             | Function    | null          | Tab switch completion callback (callback contains **`index`**, **`tabLabel`** two formal parameters)
**`screenScrollThrottle`**             | Number    | 60          | **`Screen`** Throttle parameters during lateral sliding, Unit (ms)
**`header`**             | Function / JSX Element / Class Component    | null          | Top component (if the function needs to return Element)
**`oneTabHidden`**             | Boolean    | false          | Hide itself when there is only one Tab
**`enableCachePage`**             | Boolean    | true          | Whether the persistent page will not be destroyed after switching
**`carouselProps`**             | Object    | {}          | The remaining attributes passed to Carousel < [Read Carousel](https://github.com/meliorence/react-native-snap-carousel/blob/master/doc/PROPS_METHODS_AND_GETTERS.md) >
**`sectionListProps`**             | Object    | {}          | Remaining attributes passed to SectionList < [Read SectionList](https://reactnative.dev/docs/sectionlist) >
**`toHeaderOnTab`**             | Boolean    | false          | Click to trigger the activated Tab will scroll to Header (high priority)
**`toTabsOnTab`**             | Boolean    | false          | Click to trigger the activated Tab will scroll to Tabs
**`tabsShown`**             | Boolean    | true          | Configure Tabs display and hide
**`fixedTabs`**             | Boolean    | false          | When **`enableCachePage`** is true, slide to switch Screen to set the minimum height to ensure that the Header and Tabs will not bounce
**`fixedHeader`**             | Boolean    | false          | Render together with Tabs, fix the top Header, do not follow the scroll
**`useScroll`**             | Boolean    | false          | Does Tabs support horizontal scrolling (it needs to be enabled when there are multiple category Tabs, it is recommended that **`tabStyle`** pass in a fixed width)
**`useScrollStyle`**             | Object    | {}          | Set **`contentContainerStyle`** for scrolling **`Tabs`**, usually add margins to the left and right sides **`paddingLeft`** **`paddingHorizontal`**
**`fillScreen`**             | Boolean    | true          | Fill the entire Screen
**`title`**             | Function / JSX Element / Class Component    | null          | Animation title
**`titleArgs`**             | Object    | **`{  style: {}, interpolateOpacity: {}, interpolateHeight: {} }`**          | Title parameter configuration < [Read interpolate](https://reactnative.dev/docs/animations#interpolation) >
**`onScroll`**             | Function    | null          | Scroll event monitoring
**`onScroll2Horizontal`**             | Function    | null          | Scroll event monitoring for orizontal
**`tabsEnableAnimated`**             | Boolean    | false          | Enable sliding effect for Tabs, Need to specify **`width`** for **`tabStyle`**
**`tabsEnableAnimatedUnderlineWidth`**             | Number    | 0          | To set a fixed width for the Tabs Underline and add a jumping animation, you need to enable **`tabsEnableAnimated=true`**. (It is recommended to pass in one third of **`tabStyle.width`** or a fixed 30px)

## <a name="method"/>Method

``` javascript
  <ScrollableTabView
    ref={rf => (this.scrollableTabView = rf)}
  >
  </ScrollableTabView> 
  this.scrollableTabView.getCurrentRef();
  this.scrollableTabView.toTabView(1);
  this.scrollableTabView.scrollTo(0);
  this.scrollableTabView.clearStacks(()=>alert('done'));
```

Name              | Type     | Description
----------------- | -------- | -----------
**`getCurrentRef(index: number.optional)`**            | Function   | Get the instance of the currently active view, you can pass **`index`** to get the specified instance
**`toTabView(index: number.required / label: string.required)`**            | Function   | Jump to the specified Screen
**`scrollTo(index: number.required)`**            | Function   | Swipe up and down to the specified position (passing in 0 is the default positioning to tabs / passing in a negative number is set to the top)
**`clearStacks(callback: function.optional)`**            | Function   | Clear the Stacks and related state (Tabs / Badge / Stacks))

## <a name="StackProperty"/>Stack Property

Name              | Type     | Description
----------------- | -------- | -----------
**`screen`**            | Class Component   | Screen class components
**`sticky`**            | Class Component   | Sticky component, The context of this type of component will be returned in the instance
**`tabLabel`**            | String   | Tab display name
**`tabLabelRender`**            | Function   | Custom Tab rendering function, priority is higher than **`tabLabel`**
**`badge`**            | Array    | For the current Tab badge, it is mutually exclusive with the **`badges`** attribute, and has a higher priority than the outermost attribute **`badges`** < [Read Badge Property](#BadgeProperty) >
**`toProps`**            | Object    | **`toProps`** Only pass to Screen without data association

## <a name="BadgeProperty"/>Badge Property

Type     | Description
-------- | -----------
JSX Element   | Badges/Hovering Tips, etc. rendered based on the current Tab


##  <a name="InjectionLifecycle"/>Injection lifecycle to Screen

Name              | Type     | Description
----------------- | -------- | -----------
**`onRefresh`**            | Function   | Triggered when pull-down refresh, the formal parameter **`toggled`** function is used to switch the display of the native loading state, if the user switches the tab during loading, it will be forced to hide and reset the state
**`onEndReached`**            | Function   | Swipe up to load more triggers


##  <a name="InjectionScreenProps"/>Injection props to Screen

Name              | Type     | Description
----------------- | -------- | -----------
**`refresh()`**            | Function   | Manually trigger refresh and synchronize Screen status to Sticky
**`scrollTo(index: number.required)`**            | Function   | Swipe up and down to the specified position (passing in 0 is the default positioning to tabs / passing in a negative number is set to the top)
**`toTabView(index: number.required / label: string.required)`**            | Function   | Jump to the specified Screen
**`layoutHeight.container`**            | Number | Total height of the Container
**`layoutHeight.header`**            | Number   | Total height of the Header
**`layoutHeight.tabs`**            | Number   | Total height of the Tabs
**`layoutHeight.screen`**            | Number   | Total height of the Screen

##  <a name="InjectionStickyProps"/>Injection props to Sticky

Name              | Type     | Description
----------------- | -------- | -----------
**`screenContext`**            | Object   | Get Screen context

## <a name="KnownIssues"/>Known Issues
- If you just add a `Stack`, you can `Push`, but if you need to update or delete a `Stack`, please use [clearStacks](#Method) and then add the `Stacks` you need

## <a name="Snapshot"/>Snapshot

### Android (Sliding Tabs)
<img src="./snapshot/e18k6-3jmxk.gif" />
### iOS (Bounce Tabs)
<img src="./snapshot/e18k6-3jmxk-2.gif" />
### API Example
<img src="./snapshot/qoz8r-klpuc.gif" />
<br />

---

**MIT Licensed**
