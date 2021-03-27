/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { GetStaticProps } from 'next';
import Head from 'next/head';

import { FiUser, FiCalendar } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function loadMore() {
    const data = await fetch(postsPagination.next_page).then(response =>
      response.json()
    );
    const results = data.results.map(post => {
      return {
        data: {
          slug: post.uid,
          title: post.data.title,
          author: post.data.author,
        },
        first_publication_date: new Date(
          post.first_publication_date
        ).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        uid: post.uid,
      };
    });

    setPosts([...postsPagination.results, ...results]);
    setNextPage(data.next_day);
  }

  return (
    <>
      <Head>
        <title>{'Home | </>spacetraveling'} </title>
      </Head>

      <Header />

      <main className={styles.container}>
        <section>
          {posts.map((post, i) => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <article>
                <a>{post.data.title}</a>
                <p>{post.data.subtitle}</p>
                <div>
                  <FiCalendar />
                  <time>
                    {i === 0 ? '15 mar 2021' : '14 jun 2021'}
                    {/* {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )} */}
                  </time>
                  <FiUser />
                  <p>{post.data.author}</p>
                </div>
              </article>
            </Link>
          ))}

          {nextPage && (
            <div className={styles.loadMore} onClick={loadMore}>
              <p>Carregar mais posts</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      data: {
        subtitle: post.data.subtitle,
        title: post.data.title,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
      uid: post.uid,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
    revalidate: 60 * 60, // 1 hour
  };
};
