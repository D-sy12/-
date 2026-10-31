export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/exam/index',
    'pages/listen/index',
    'pages/practice/index',
    'pages/vocab/index',
    'pages/favorites/index',
    'pages/intensive/index',
    'pages/word-detail/index',
  ],
  subPackages: [
    {
      root: 'packageExam',
      pages: ['pages/quiz/index'],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'CET-4 词根背单词',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f7fb',
  },
  tabBar: {
    color: '#8d99ad',
    selectedColor: '#4f7cff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png',
      },
      {
        pagePath: 'pages/exam/index',
        text: '真题模考',
        iconPath: 'assets/tabbar/exam.png',
        selectedIconPath: 'assets/tabbar/exam-selected.png',
      },
      {
        pagePath: 'pages/listen/index',
        text: '听力',
        iconPath: 'assets/tabbar/listen.png',
        selectedIconPath: 'assets/tabbar/listen-selected.png',
      },
      {
        pagePath: 'pages/practice/index',
        text: '练习',
        iconPath: 'assets/tabbar/practice.png',
        selectedIconPath: 'assets/tabbar/practice-selected.png',
      },
      {
        pagePath: 'pages/vocab/index',
        text: '词汇',
        iconPath: 'assets/tabbar/vocab.png',
        selectedIconPath: 'assets/tabbar/vocab-selected.png',
      },
    ],
  },
});
