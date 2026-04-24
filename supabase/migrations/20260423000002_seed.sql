-- Seed: categories, tags, curated sources.
-- Safe to re-run: all inserts are idempotent by unique slug / url.

-- ---------- categories ----------
insert into public.categories (slug, name, description) values
  ('ivf-fertility',     'IVF & Fertility',     'Assisted reproduction, IVF, IUI, and fertility treatment.'),
  ('adoption',          'Adoption',            'Domestic, international, and foster-to-adopt pathways.'),
  ('surrogacy',         'Surrogacy',           'Gestational carriers, legal considerations, and clinical care.'),
  ('lgbtq-family',      'LGBTQ+ Family Building', 'Resources for LGBTQ+ parents-to-be.'),
  ('grants-financing',  'Grants & Financing',  'Grants, loans, insurance, and employer benefits.'),
  ('pregnancy-loss',    'Pregnancy & Infant Loss', 'Support and information after loss.'),
  ('mental-health',     'Mental Health',       'Fertility-related mental health and postpartum care.'),
  ('policy-research',   'Policy & Research',   'New studies, guidelines, and policy updates.')
on conflict (slug) do nothing;

-- ---------- tags ----------
insert into public.tags (slug, name) values
  ('ivf','IVF'), ('iui','IUI'), ('pcos','PCOS'), ('endometriosis','Endometriosis'),
  ('male-factor','Male Factor'), ('recurrent-loss','Recurrent Pregnancy Loss'),
  ('fertility-preservation','Fertility Preservation'), ('egg-freezing','Egg Freezing'),
  ('donor-egg','Donor Egg'), ('donor-sperm','Donor Sperm'),
  ('adoption','Adoption'), ('foster','Foster Care'), ('surrogacy','Surrogacy'),
  ('lgbtq','LGBTQ+'), ('single-parent','Single Parent by Choice'),
  ('insurance','Insurance'), ('grants','Grants'), ('employer-benefits','Employer Benefits'),
  ('acog','ACOG'), ('asrm','ASRM'), ('eshre','ESHRE'), ('cdc','CDC'), ('pubmed','PubMed')
on conflict (slug) do nothing;

-- ---------- sources (Tier 1: peer-reviewed / gov / clinical) ----------
insert into public.sources (name, url, feed_url, source_type, trust_tier, domain_authority, topic_cluster) values
  ('CDC ART Surveillance', 'https://www.cdc.gov/art/', 'https://www.cdc.gov/art/sitemap.xml', 'sitemap', 1, 95, 'stats'),
  ('Fertility and Sterility (current)', 'https://www.fertstert.org/', 'https://www.fertstert.org/current.rss', 'rss', 1, 90, 'ivf'),
  ('Fertility and Sterility (in press)', 'https://www.fertstert.org/', 'https://www.fertstert.org/inpress.rss', 'rss', 1, 90, 'ivf'),
  ('Human Reproduction (Oxford)', 'https://academic.oup.com/humrep', 'https://academic.oup.com/rss/site_5295/3152.xml', 'rss', 1, 90, 'ivf'),
  ('Human Reproduction Update', 'https://academic.oup.com/humupd', null, 'scrape', 1, 90, 'ivf'),
  ('ACOG News Releases', 'https://www.acog.org/news/news-releases', null, 'scrape', 1, 92, 'guidelines'),
  ('ASRM Latest News', 'https://www.asrm.org/news-and-events/asrm-news/latest-news/', null, 'scrape', 1, 88, 'guidelines'),
  ('NICHD Newsroom', 'https://www.nichd.nih.gov/newsroom', null, 'scrape', 1, 90, 'research'),
  ('HHS Office on Women''s Health', 'https://www.womenshealth.gov/', null, 'scrape', 1, 88, 'womens-health'),
  ('Cochrane Reproductive Health', 'https://www.cochrane.org/', null, 'scrape', 1, 92, 'evidence'),
  ('PubMed: IVF', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'ivf'),
  ('PubMed: Infertility', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'infertility'),
  ('PubMed: PCOS', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'pcos'),
  ('PubMed: Endometriosis', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'endometriosis'),
  ('PubMed: Male Factor Infertility', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'male-factor'),
  ('PubMed: Recurrent Pregnancy Loss', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'recurrent-loss'),
  ('PubMed: Fertility Preservation', 'https://pubmed.ncbi.nlm.nih.gov/', null, 'rss', 1, 95, 'fertility-preservation')
on conflict (name) do nothing;

-- ---------- sources (Tier 2: advocacy / patient-facing nonprofits) ----------
insert into public.sources (name, url, feed_url, source_type, trust_tier, domain_authority, topic_cluster) values
  ('RESOLVE: The National Infertility Association', 'https://resolve.org/', 'https://resolve.org/feed/', 'rss', 2, 75, 'advocacy'),
  ('ReproductiveFacts.org (ASRM patient)', 'https://www.reproductivefacts.org/', null, 'scrape', 2, 78, 'patient-ed'),
  ('National Council For Adoption', 'https://adoptioncouncil.org/blog/', 'https://adoptioncouncil.org/feed/', 'rss', 2, 70, 'adoption'),
  ('Family Equality', 'https://familyequality.org/', 'https://familyequality.org/feed/', 'rss', 2, 70, 'lgbtq'),
  ('Men Having Babies', 'https://menhavingbabies.org/', 'https://menhavingbabies.org/surrogacy-resources/blog/feed/', 'rss', 2, 65, 'surrogacy'),
  ('SART', 'https://www.sart.org/', null, 'scrape', 2, 80, 'ivf'),
  ('Child Welfare Information Gateway', 'https://www.childwelfare.gov/', null, 'scrape', 2, 85, 'adoption'),
  ('Creating a Family (podcast)', 'https://creatingafamily.org/', 'https://rss.buzzsprout.com/275835.rss', 'rss', 2, 65, 'adoption'),
  ('National Infertility Awareness Week', 'https://infertilityawareness.org/', null, 'scrape', 2, 60, 'advocacy'),
  ('PCOS Challenge', 'https://pcoschallenge.org/', null, 'scrape', 2, 65, 'pcos'),
  ('Endometriosis Foundation of America', 'https://endofound.org/', null, 'scrape', 2, 68, 'endometriosis'),
  ('Share Pregnancy & Infant Loss Support', 'https://nationalshare.org/', null, 'scrape', 2, 62, 'loss'),
  ('Star Legacy Foundation', 'https://starlegacyfoundation.org/', null, 'scrape', 2, 60, 'loss'),
  ('Postpartum Support International', 'https://postpartum.net/', null, 'scrape', 2, 70, 'mental-health')
on conflict (name) do nothing;

-- ---------- sources (Tier 3: journalism, clinic blogs — topic mining only) ----------
insert into public.sources (name, url, feed_url, source_type, trust_tier, domain_authority, topic_cluster) values
  ('KFF Health News: Reproductive', 'https://kffhealthnews.org/topics/reproductive-health/', 'https://kffhealthnews.org/topics/reproductive-health/feed/', 'rss', 3, 78, 'journalism'),
  ('STAT News: Reproductive Medicine', 'https://www.statnews.com/category/reproductive-medicine/', 'https://www.statnews.com/category/reproductive-medicine/feed/', 'rss', 3, 82, 'journalism'),
  ('The 19th', 'https://19thnews.org/', 'https://19thnews.org/feed/', 'rss', 3, 72, 'policy'),
  ('Progyny Blog', 'https://progyny.com/blog/', 'https://progyny.com/blog/feed/', 'rss', 3, 65, 'benefits')
on conflict (name) do nothing;
