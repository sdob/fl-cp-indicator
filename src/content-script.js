import $ from 'jquery';
import MutationSummary from 'mutation-summary';

// We're importing this so that Webpack knows to build it
import './styles.scss';

// Watch DOM changes 
registerObserver();

function registerObserver() {
  const rootNode = document.querySelector('body');
  const queries = [{ element: '*' }];

  return new MutationSummary({
    rootNode,
    queries,
    callback,
  });

  function callback(summaries) {
    // The DOM structure of the left-hand column is unintuitive;
    // each stat's name, value, and progress bar is in its
    // icon's sibling element.
    document.querySelectorAll('ul.you_icon + p').forEach(handle);
  }
}

function hasInfoBarChild($node) {
  // Do any of this node's children have #infoBarBlahBlahBlah ids?
  // This distinguishes stats from Echoes and Fate.
  let hasInfoBar = false;
  $node.children().each(function() {
    if ($(this).attr('id') && $(this).attr('id').match(/infoBar/)) {
      hasInfoBar = true;
    }
  });
  return hasInfoBar;
}

function handle(node) {
  const $node = $(node);

  // Only handle nodes that have info bar children (i.e., ignore Fate, etc.)
  if (hasInfoBarChild($node)) {
    // Extract the text, which will be something along the lines of
    // '$QUALITY $VALUE'. We don't need to do any sophisticated parsing;
    // regex matching should be fine.
    const text = $node.text();

    // These definitely shouldn't have quality bars
    if (text.match(/(FATE|NOTABILITY|INFLUENCE)/)) {
      return;
    }

    // These *currently* don't have quality bars, but this could change,
    // so we'll match and ignore them separately
    if (text.match(/(RESPECTABLE|DREADED|BIZARRE)/)) {
      return;
    }
    // Get the quality level
    const level = Number($node.children('.red').text());

    // If WSDP are 200 or higher, they can't be increased, so ignore them
    if (text.match(/WATCHFUL|SHADOWY|DANGEROUS|PERSUASIVE/) && level >= 200) {
      return;
    }

    // Get the progress toward the next level as a value between 0 and 1
    const progress = .01 * Number(
      $node.next().children('.rank').children('img').attr('width').replace('%', '')
    );

    // Estimate the change points, based on
    // (a) the attribute
    // (b) the current level
    // (c) the progress.
    const cp = computeChangePoints(text, level, progress);

    // Add the <span> element, if it isn't already there
    if (!$node.next().has('.fl-cpi').length) {
      $node.next().children('.rank').children('img').after(`<span class="fl-cpi" />`);
    }

    const $indicator = $node.next().find('.fl-cpi');

    // If we're at 0 CP, then blank the span; otherwise, show the number
    $indicator.text(cp > 0 ? cp : '');
  }
}

function computeChangePoints(text, level, progress) {
  // Main-line attributes require level+1 up to level 69, and then 70 CP
  // for every level after that
  if (text.match(/(WATCHFUL|SHADOWY|DANGEROUS|PERSUASIVE)/)) {
    if (level < 69) {
      return Math.round(progress * (level + 1));
    }
    return Math.round(progress * 70);
  }
  
  // Other attributes work the same up to level 49
  if (level < 49) {
    return Math.round(progress * (level + 1));
  }
  return Math.round(progress * 50);
}
