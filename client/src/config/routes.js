import componentLoader from '../utils/componentLoader';

// Register all components with correct paths
componentLoader.registerBatch({
    'Home': 'components/Body/Landing/Home/Home',
    'Market': 'components/Body/Landing/Pages/Market/Market',
    'P2P': 'components/Body/Landing/Pages/P2P/P2P',
    'SpotTrade': 'components/Body/Landing/Pages/SpotTrade/SpotTrade',
    'Predictions': 'components/Body/Landing/Pages/Predictions/Predictions',
    'About': 'components/Body/Landing/Pages/About/About',
    'Portfolio': 'components/Body/Landing/Pages/Portfolio/Portfolio',
    'Profile': 'components/Body/Landing/Pages/Profile/Profile',
    'Login': 'components/Body/Landing/auth/Login',
    'Register': 'components/Body/Landing/auth/Register'
});

// Route configuration
const routes = [
    {
        path: '/',
        component: 'Home',
        exact: true,
        public: true
    },
    {
        path: '/market',
        component: 'Market',
        public: true
    },
    {
        path: '/p2p',
        component: 'P2P',
        public: true
    },
    {
        path: '/trade',
        component: 'SpotTrade',
        public: true
    },
    {
        path: '/predictions',
        component: 'Predictions',
        public: true
    },
    {
        path: '/about',
        component: 'About',
        public: true
    },
    {
        path: '/portfolio',
        component: 'Portfolio',
        protected: true
    },
    {
        path: '/profile',
        component: 'Profile',
        protected: true
    },
    {
        path: '/login',
        component: 'Login',
        public: true,
        guestOnly: true
    },
    {
        path: '/register',
        component: 'Register',
        public: true,
        guestOnly: true
    }
];

export default routes; 