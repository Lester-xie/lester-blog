import Head from 'next/head'
import Layout from '../../components/layout'
import { getAllPostIds, getPostData } from '../../lib/posts'
import utilStyles from '../../styles/utils.module.css'
import {useEffect} from 'react'

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id)
  return {
    props: {
      postData
    }
  }
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false
  }
}

export default function Post({ postData }) {
  useEffect(() => {
    setTimeout(() => {
      window.Prism.highlightAll()
      document.querySelectorAll('article a').forEach(a => {
        a.setAttribute('target', '_blank')
      })
    }, 1000)
  })

  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
        <link rel="stylesheet" href="/css/prism.css" />
        <script src="/js/prism.min.js" />
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={utilStyles.lightText}>{postData.date}</div>
        <hr className={utilStyles.divider} />
        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
      </article>
    </Layout>
  )
}
