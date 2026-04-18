import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import SearchView from '../views/SearchView.vue'
import ReplyDetailView from '../views/ReplyDetailView.vue'
import ReplayDetailView from '../views/ReplayDetailView.vue'
import UserDetailView from '../views/UserDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/post/:id',
      name: 'post',
      component: PostDetailView,
      props: true
    },
    {
      path: '/reply/:commentId',
      name: 'reply',
      component: ReplyDetailView,
      props: true
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView
    },
    {
      path: '/replay/:recordId',
      name: 'replay',
      component: ReplayDetailView,
      props: true
    },
    {
      path: '/user/:uid',
      name: 'user',
      component: UserDetailView,
      props: true
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      if (to.name !== 'home') {
        return { top: 0 }
      }
    }
  }
})

export default router
