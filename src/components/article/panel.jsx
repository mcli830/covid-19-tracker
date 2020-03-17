import React from 'react';
import PropTypes from 'prop-types';
import Panel from './panel.css';

const apiKey = process.env.NEWS_API_KEY;

const ArticlePanel = ({locales, setLocaleWeight, localeSelected, searchTopic}) => {

    const panelRef = React.useRef();
    
    const [state, setState] = React.useState({
        loading: true,
        articles: [],
    });

    /*
     *  Functions
     */

    // remove metadata in article.content string
    const formatContent = (content) => {
        if (!content) return '';
        return content.replace(/(<.*>|\[.*chars\]$)/g, '');
    }

    const getTopicLocale = function(article) {
        if (!locales || locales.length < 1) return;

        locales.forEach(lname => {
            if ((article.title && article.title.includes(lname)) || (article.content && article.content.includes(lname))) {
                return article.locale = lname;
            }
        })
    }

    // helper to handle news api fetch response
    const fetchNewsApi = (endpoint) => {
        fetch(endpoint).then(res => {
            return res.json();
        }).then(res => {

            const articles = res.articles || [];

            articles.forEach(art => {
                getTopicLocale(art);
            });

            setState(s => ({
                loading: false,
                articles,
            }));
        });
    }
    
    // Get articles from News API.
    // Default query without specified locales will
    // return top headlines without location filtering.
    const fetchArticles = function() {
        // get date params        
        const fromDate = new Date();
        fromDate.setDate(new Date().getDate() - 14);
        const dateString = `${fromDate.getFullYear()}-${('0'+(fromDate.getMonth()+1)).slice(-2)}-${('0'+fromDate.getDate()).slice(-2)}`;
        // form keyword/location query
        var keywords = '';
        if (searchTopic) {
            keywords += `"${searchTopic}"`;
        }
        if (locales.length > 0) {
            if (searchTopic) {
                keywords += ' AND ';
            }
            keywords += `(${locales.join(" OR ")})`;
        }
        const query = encodeURI(keywords);
        // build api endpoint
        const endpoint = `http://newsapi.org/v2/everything?q=${query}&from=${dateString}&sortBy=popularity&apiKey=${apiKey}&pageSize=100&language=en`;
        // fetch api
        fetchNewsApi(endpoint);
    }

    const fetchHeadlines = function() {
      const endpoint = `http://newsapi.org/v2/top-headlines?pageSize=20&language=en&country=us&apiKey=${apiKey}`;
      fetchNewsApi(endpoint);
    }

    /*
     *  Effects
     */

    // fetch articles on init and locales or searchTopic update
    React.useEffect(() => {
        if (locales.length > 0 || searchTopic) {
            fetchArticles()
        } else {
            fetchHeadlines()
        }
        setState(s => ({
            ...s,
            loading: true,
        }));
        // scroll panel to top after new search
        panelRef.current.scrollTop = 0;
    }, [locales, searchTopic]);

    // update localeWeights after fetchArticles
    React.useEffect(() => {
        // only trigger when finished loading
        if (!state.loading) {
            const weights = {};
          
            state.articles.forEach(art => {
                // increment locale tally
                if (art.locale) {
                  if (weights.hasOwnProperty(art.locale)) {
                    weights[art.locale]++;
                  } else {
                    weights[art.locale] = 1;
                  }
                }
            });

            // update index localeWeights
            setLocaleWeight(weights);
        }
    }, [state.loading, state.articles]);

    /*
     *  Render
     */

    return (
      <Panel.list ref={panelRef}>
        <h4>
          {searchTopic ? (
            <strong>
              {searchTopic}
            </strong>
          ) : (
            "News"
          )}
          {locales.length > 0 && (
            <>
              <span> near </span>
              <em>{locales.join(", ")}</em>
            </>
          )}
        </h4>
        {state.articles.length > 0 ? (
          state.articles
            .filter(a => !!a.locale)
            .map((a, i) => (
              <Panel.item key={i} highlight={a.locale === localeSelected}>
                <a href={a.url} target="__blank" rel="noreferrer noopener">
                  <h5>
                    <strong>{a.title}</strong>
                  </h5>
                </a>
                <h6>
                  <em>{a.author}</em>
                  {a.locale && (
                    <>
                      <span> &ndash; </span>
                      <em>{a.locale}</em>
                    </>
                  )}
                </h6>
                <p>{formatContent(a.content || a.description)}</p>
                <em>{new Date(a.publishedAt).toDateString()}</em>
              </Panel.item>
            ))
        ) : (
          <Panel.item>No articles</Panel.item>
        )}
      </Panel.list>
    )
}

ArticlePanel.propTypes = {
    articles: PropTypes.array,
}

ArticlePanel.defaultProps = {
    articles: [],
}

export default ArticlePanel;