import common from './dictionaries/common'
import nav from './dictionaries/nav'
import footer from './dictionaries/footer'
import shopping from './dictionaries/shopping'
import auth from './dictionaries/auth'
import shop from './dictionaries/shop'
import giProducts from './dictionaries/giProducts'
import artisansPage from './dictionaries/artisansPage'
import artisanDetail from './dictionaries/artisanDetail'
import about from './dictionaries/about'
import join from './dictionaries/join'
import chatbot from './dictionaries/chatbot'
import home from './dictionaries/home'
import adminArtisans from './dictionaries/adminArtisans'
import adminGiProducts from './dictionaries/adminGiProducts'
import artisanDashboard from './dictionaries/artisanDashboard'
import delivery from './dictionaries/delivery'
import adminHome from './dictionaries/adminHome'
import adminProducts from './dictionaries/adminProducts'
import adminOrders from './dictionaries/adminOrders'
import adminUsers from './dictionaries/adminUsers'

export const registry = {
  common,
  nav,
  footer,
  shopping,
  auth,
  shop,
  giProducts,
  artisansPage,
  artisanDetail,
  about,
  join,
  chatbot,
  home,
  adminArtisans,
  adminGiProducts,
  artisanDashboard,
  delivery,
  adminHome,
  adminProducts,
  adminOrders,
  adminUsers,
}

export type Namespace = keyof typeof registry
