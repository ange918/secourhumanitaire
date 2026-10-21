/* English / French. English is the source text in the HTML; French lives here. */
(() => {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  /* plain text nodes, keyed by the exact English text */
  const FR = {
    'Why Fode?': 'Pourquoi Fode ?', 'Menu': 'Menu', 'About': 'À propos', 'Reviews': 'Avis', 'Order now': 'Commander',
    'Sign In': 'Connexion', 'Login': 'Inscription',
    'Italian Pasta': 'Pâtes italiennes', 'With Special Sauce': 'À la sauce spéciale',
    'Italian pasta with special sauce is a flavor you can find only in': 'Des pâtes italiennes à la sauce spéciale, une saveur que vous ne trouverez que chez',
    'Buy Now': 'Acheter', "Chef's Recommendation": 'La recommandation du chef', 'See the menu types': 'Voir les types de menu',
    'Discount coupon': 'Coupon de réduction', '‹ Prew': '‹ Préc.', 'Next ›': 'Suiv. ›',
    'Special sauce': 'Sauce spéciale', 'Fresh daily': 'Frais chaque jour', 'Hot in 30 min': 'Chaud en 30 min', 'Handmade dough': 'Pâte faite main', 'Made with love': 'Fait avec amour',
    'Slow-simmered tomatoes, fresh basil and a pinch of a secret we never share. That is the flavor you only find at Fode.': 'Tomates mijotées lentement, basilic frais et une pincée d’un secret que nous ne partageons jamais. C’est la saveur que l’on ne trouve que chez Fode.',
    '30 minutes or less': '30 minutes ou moins', 'Your order goes from the pan to your door in half an hour. Hot when it leaves, hot when it arrives.': 'Votre commande passe de la poêle à votre porte en une demi-heure. Chaude au départ, chaude à l’arrivée.',
    'Made with care': 'Préparé avec soin', 'Local produce, handmade dough and zero shortcuts. Every plate is checked by a chef before it leaves the kitchen.': 'Produits locaux, pâte faite main et aucun raccourci. Chaque assiette est vérifiée par un chef avant de quitter la cuisine.',
    'Recipes': 'Recettes', 'Happy guests': 'Clients ravis', 'min': 'min', 'Average delivery': 'Livraison moyenne', 'Customer rating': 'Note clients',
    'Our menu': 'Notre menu', 'All': 'Tout', 'Pasta': 'Pâtes', 'Pizza': 'Pizza', 'Asian': 'Asiatique', 'Burger': 'Burger', 'Dessert': 'Dessert',
    'Special sauce, basil, parmesan.': 'Sauce spéciale, basilic, parmesan.', 'Pepperoni, jalapeño, mozzarella.': 'Pepperoni, jalapeño, mozzarella.',
    'Wok Noodles': 'Nouilles sautées', 'Sticky chicken, veggies, sesame.': 'Poulet caramélisé, légumes, sésame.',
    'Smash Burger': 'Smash Burger', 'Double patty, cheddar, house sauce.': 'Double steak, cheddar, sauce maison.',
    'Tiramisu': 'Tiramisu', 'Mascarpone, espresso, cocoa.': 'Mascarpone, expresso, cacao.',
    'Garden Bowl': 'Bowl du jardin', 'Fresh greens, tomato, light dressing.': 'Verdure fraîche, tomate, vinaigrette légère.',
    'About Fode': 'À propos de Fode',
    'Fode started with one pan and one sauce. Today our chefs cook pasta, pizza and dumplings the same way: fresh ingredients, patient cooking and a lot of love. No frozen shortcuts, ever.': 'Fode a commencé avec une poêle et une sauce. Aujourd’hui, nos chefs cuisinent pâtes, pizzas et raviolis de la même façon : des produits frais, une cuisson patiente et beaucoup d’amour. Jamais de raccourci surgelé.',
    'Dough made by hand every morning': 'Pâte pétrie à la main chaque matin', 'Sauces simmered for six hours': 'Sauces mijotées pendant six heures', 'Recyclable, heat-keeping packaging': 'Emballage recyclable qui garde la chaleur',
    'Meet the chefs': 'Rencontrer les chefs', 'How it works': 'Comment ça marche',
    'Choose': 'Choisissez', 'Pick a plate from the menu or let the chef recommend one.': 'Prenez un plat dans le menu ou laissez le chef vous en recommander un.',
    'We cook': 'On cuisine', 'Your order is cooked from scratch the moment you tap Buy Now.': 'Votre commande est préparée de zéro dès que vous touchez Acheter.',
    'Enjoy': 'Régalez-vous', 'Hot food at your door in 30 minutes, or the next one is on us.': 'Un plat chaud à votre porte en 30 minutes, ou le suivant est offert.',
    '“The best sauce is the one you taste once and keep thinking about.”': '« La meilleure sauce est celle qu’on goûte une fois et à laquelle on repense. »', '— Marco, head chef': '— Marco, chef de cuisine',
    'The pasta sauce is unreal. Arrived hot and on time, will order again.': 'La sauce des pâtes est incroyable. Arrivé chaud et à l’heure, je recommande.',
    'Best dumplings in town. The sesame crunch is just right.': 'Les meilleurs raviolis de la ville. Le croquant du sésame est parfait.',
    'Great pizza and a super simple app. The discount coupons are a nice touch.': 'Super pizza et une appli très simple. Les coupons de réduction sont un vrai plus.',
    'first order': 'première commande', 'Get my coupon': 'Recevoir mon coupon', 'Thanks! Check your inbox for your coupon.': 'Merci ! Votre coupon arrive dans votre boîte mail.',
    'Fresh pasta, pizza and dumplings made to order, with a special sauce you can only find at Fode.': 'Pâtes fraîches, pizzas et raviolis préparés à la commande, avec une sauce spéciale que l’on ne trouve que chez Fode.',
    'Get new dishes and coupons in your inbox': 'Recevez les nouveaux plats et les coupons par e-mail', 'Subscribe': 'S’abonner', 'Thanks for subscribing!': 'Merci pour votre inscription !',
    'Burgers': 'Burgers', 'Desserts': 'Desserts', 'Company': 'Entreprise', 'About us': 'Qui sommes-nous', 'Our chefs': 'Nos chefs', 'Careers': 'Carrières', 'Press': 'Presse',
    'Support': 'Aide', 'Help center': 'Centre d’aide', 'Delivery areas': 'Zones de livraison', 'Track my order': 'Suivre ma commande', 'Gift cards': 'Cartes cadeaux', 'FAQ': 'FAQ',
    'Visit us': 'Nous trouver', '24 Market Street': '24 rue du Marché', '75003 Paris, France': '75003 Paris, France', 'Every day': 'Tous les jours', '11:00 to 23:00': 'de 11h00 à 23h00',
    'Download on the': 'Télécharger sur', 'Get it on': 'Disponible sur',
    '© 2026 Fode. All rights reserved.': '© 2026 Fode. Tous droits réservés.', 'Privacy': 'Confidentialité', 'Terms': 'Conditions', 'Cookies': 'Cookies', 'Accessibility': 'Accessibilité',
    'Your cart': 'Votre panier', 'Your cart is empty': 'Votre panier est vide', 'Add a dish from the menu and it will show up here.': 'Ajoutez un plat depuis le menu et il apparaîtra ici.', 'Browse the menu': 'Voir le menu',
    'Subtotal': 'Sous-total', 'Delivery': 'Livraison', 'Total': 'Total', 'Checkout': 'Paiement',
    'Contact': 'Contact', 'Full name': 'Nom complet', 'Phone': 'Téléphone', 'Email': 'E-mail', 'Delivery address': 'Adresse de livraison', 'Street and number': 'Rue et numéro', 'City': 'Ville', 'Postal code': 'Code postal',
    'Payment': 'Paiement', 'Card': 'Carte', 'Cash on delivery': 'Espèces à la livraison', 'Card number': 'Numéro de carte', 'Name on card': 'Nom sur la carte', 'Expiry': 'Expiration', 'CVC': 'CVC',
    'Demo checkout. No payment is taken and your details are not sent or saved anywhere.': 'Paiement de démonstration. Aucun paiement n’est prélevé et vos informations ne sont ni envoyées ni enregistrées.',
    'Order confirmed': 'Commande confirmée', 'Thank you': 'Merci', '! Your order': ' ! Votre commande', 'is being cooked and will arrive in about 30 minutes.': 'est en préparation et arrivera dans environ 30 minutes.',
    'Paid': 'Payé', 'Delivering to': 'Livraison à', 'Back to the site': 'Retour au site',
  };

  /* strings used by scripts, with {vars} */
  const DYN = {
    'Your cart ({n})': 'Votre panier ({n})', 'Checkout title': 'Paiement', 'Thank you title': 'Merci', 'Free': 'Offerte',
    'Add {x} more for free delivery': 'Ajoutez {x} pour la livraison offerte', 'You get free delivery': 'Livraison offerte',
    'Pay {x}': 'Payer {x}', 'Processing…': 'Traitement…', 'Please check the highlighted fields.': 'Vérifiez les champs en surbrillance.',
    '{name} added to your cart': '{name} ajouté au panier', 'Coming soon': 'Bientôt disponible',
    'Remove one': 'Retirer un', 'Add one': 'Ajouter un', 'Quantity of {name}': 'Quantité de {name}', 'Remove {name} from cart': 'Retirer {name} du panier',
    'Mexicoo Pizza': 'Mexicoo Pizza', 'Spaghetti Pomodoro': 'Spaghetti Pomodoro', 'Italian Pasta': 'Pâtes italiennes', 'Wok Noodles': 'Nouilles sautées', 'Garden Bowl': 'Bowl du jardin',
    'Smash Burger': 'Smash Burger', 'Tiramisu': 'Tiramisu',
    'Menu: Why Fode? · About · Menu': 'Menu : Pourquoi Fode ? · À propos · Menu',
  };

  /* section titles: key is the English text, value the French HTML */
  const TITLES = {
    'Why Fode?': 'Pourquoi Fode ?',
    'Cooked fresh, delivered hot': 'Cuisiné minute, <b>livré brûlant</b>',
    'Pick your favorite plate': 'Choisissez <b>votre plat préféré</b>',
    'A small kitchen with big flavor': 'Une petite cuisine, <b>de grandes saveurs</b>',
    'From our kitchen to your table': 'De notre cuisine <b>à votre table</b>',
    'People love it': 'Ils <b>adorent</b>',
  };
  const HTMLS = { 'Hungry? Your discount coupon is waiting.': 'Un petit creux ? Votre <b>coupon de réduction</b> vous attend.' };

  const ATTRS = {
    placeholder: { 'Your email address': 'Votre adresse e-mail', 'Amira Khan': 'Amira Khan', 'you@email.com': 'vous@email.com', '12 Rue des Lilas': '12 rue des Lilas' },
    'aria-label': { 'Open cart': 'Ouvrir le panier', 'Search': 'Rechercher', 'Open menu': 'Ouvrir le menu', 'Close menu': 'Fermer le menu', 'Discount coupon': 'Coupon de réduction', 'Add': 'Ajouter', 'Email': 'E-mail', 'Subscribe': 'S’abonner', 'Accepted payments': 'Moyens de paiement acceptés', 'Legal': 'Mentions légales', 'Back to cart': 'Retour au panier', 'Close cart': 'Fermer le panier', 'Payment method': 'Mode de paiement' },
    alt: { 'Wok noodles with chicken and herbs in a black bowl, with chopsticks': 'Nouilles sautées au poulet et aux herbes dans un bol noir, avec des baguettes', 'Wok noodles in a black bowl': 'Nouilles sautées dans un bol noir' },
  };

  /* ---- collect translatable nodes once (English originals are kept) ---- */
  const textNodes = [], attrNodes = [], blocks = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) { const p = n.parentElement; if (!p || p.closest('script,style,.title,[data-html-key]')) return NodeFilter.FILTER_REJECT; return FR[norm(n.nodeValue)] !== undefined ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; },
  });
  for (let n; (n = walker.nextNode());) textNodes.push({ n, en: n.nodeValue, key: norm(n.nodeValue) });
  Object.entries(ATTRS).forEach(([a, map]) => document.querySelectorAll(`[${a}]`).forEach((el) => { const v = el.getAttribute(a); if (map[v] !== undefined) attrNodes.push({ el, a, en: v, map }); }));
  document.querySelectorAll('.title').forEach((el) => { const k = norm(el.textContent); if (TITLES[k]) blocks.push({ el, en: el.innerHTML, fr: TITLES[k] }); });
  document.querySelectorAll('h2').forEach((el) => { const k = norm(el.textContent); if (!el.classList.contains('title') && HTMLS[k]) { el.dataset.htmlKey = k; blocks.push({ el, en: el.innerHTML, fr: HTMLS[k] }); } });
  const firstNames = textNodes.length; // eslint-disable-line no-unused-vars

  /* ---- state ---- */
  let lang = 'en';
  try { lang = localStorage.getItem('fode-lang') || ''; } catch (e) { lang = ''; }
  if (lang !== 'en' && lang !== 'fr') lang = /^fr/i.test(navigator.language || '') ? 'fr' : 'en';
  const subs = [];

  function t(key, vars) {
    let s = lang === 'fr' && DYN[key] !== undefined ? DYN[key] : key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split(`{${k}}`).join(vars[k]); });
    return s;
  }

  function apply() {
    document.documentElement.lang = lang;
    textNodes.forEach(({ n, en, key }) => { n.nodeValue = lang === 'fr' ? en.replace(key, FR[key]) : en; });
    attrNodes.forEach(({ el, a, en, map }) => el.setAttribute(a, lang === 'fr' ? map[en] : en));
    blocks.forEach(({ el, en, fr }) => { el.innerHTML = lang === 'fr' ? fr : en; });
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
      b.querySelectorAll('span').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
      b.setAttribute('aria-label', lang === 'fr' ? 'Changer de langue : Français' : 'Change language: English');
    });
    if (window.splitTitles) window.splitTitles();
  }

  function set(l) {
    if (l === lang) return;
    lang = l;
    try { localStorage.setItem('fode-lang', lang); } catch (e) { /* ignore */ }
    apply();
    subs.forEach((f) => f(lang));
  }

  window.I18N = {
    t, set, get lang() { return lang; }, locale: () => (lang === 'fr' ? 'fr-FR' : 'en-US'),
    onChange: (f) => subs.push(f),
  };
  document.querySelectorAll('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => set(lang === 'fr' ? 'en' : 'fr')));
  apply();
})();
