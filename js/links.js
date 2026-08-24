/**
 * Digital business card page
 * Update GOOGLE_REVIEW_URL and social URLs when available
 */
(function () {
  'use strict';

  const GOOGLE_REVIEW_URL = ''; // e.g. 'https://g.page/r/xxxxx/review'
  const SOCIAL = {
    tiktok: '',
    instagram: '',
    facebook: '',
  };

  const reviewBtn = document.getElementById('google-review');
  if (reviewBtn && GOOGLE_REVIEW_URL) {
    reviewBtn.href = GOOGLE_REVIEW_URL;
    reviewBtn.target = '_blank';
    reviewBtn.rel = 'noopener noreferrer';
  } else if (reviewBtn) {
    reviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Google review link coming soon — ask Rehan for the direct link.');
    });
  }

  const socialMap = [
    ['TikTok', SOCIAL.tiktok],
    ['Instagram', SOCIAL.instagram],
    ['Facebook', SOCIAL.facebook],
  ];

  document.querySelectorAll('.social-btn').forEach((btn, i) => {
    const url = socialMap[i]?.[1];
    const name = socialMap[i]?.[0];
    if (url) {
      btn.href = url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
    } else {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        alert(name + ' link coming soon.');
      });
    }
  });
})();
