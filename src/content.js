// Brand images, journal articles and care notes.

// Brand photos are generated lifestyle scenes saved in public/img/brand/
// (the full-size originals are listed in seed/photo-urls.json).
const BRAND = ['hero', 'walk', 'burrow', 'treat', 'stairs', 'parcels', 'snow', 'puppy'];
function brandImage(name) {
  return BRAND.includes(name) ? `/img/brand/${name}.jpg` : '/img/brand/hero.jpg';
}

const JOURNAL = [
  {
    slug: 'protecting-your-dachshunds-back',
    title: 'Protecting your dachshund’s back',
    summary: 'Long backs and short legs need a little extra care. Five everyday habits that lower the risk of a back injury.',
    image: 'stairs',
    date: 'October 12, 2026',
    body: [
      'Dachshunds are built long and low, which is a big part of their charm. It also puts extra strain on the discs in their spine, and back problems such as intervertebral disc disease (IVDD) are far more common in dachshunds than in most breeds. You can’t change their build, but a few everyday habits make a real difference.',
      '## 1. Cut down on jumping',
      'Jumping on and off the couch or bed is one of the biggest everyday strains on a dachshund’s back. Pet stairs or a ramp next to their favourite spots let them get up and down on their own without the jolt of landing.',
      '## 2. Walk with a harness',
      'A harness spreads pressure across the chest instead of pulling on the neck and upper spine. Look for a soft vest harness that fits snugly without rubbing behind the front legs.',
      '## 3. Keep them lean',
      'Every extra kilo hangs off the middle of a long back. Measure meals, count treats as part of the day’s food, and pick small training treats you can hand out without overdoing it.',
      '## 4. Pick them up properly',
      'Support both ends: one hand under the chest and one under the hind end, keeping the back level. Never lift a dachshund by the front legs or under the armpits alone.',
      '## 5. Know the warning signs',
      'A hunched back, reluctance to move or climb, yelping when touched, a wobbly walk or dragging back feet all need a vet’s attention the same day. Back problems caught early have much better outcomes.',
      'This article is general information, not veterinary advice. Your vet knows your dog best.',
    ],
  },
  {
    slug: 'choosing-the-right-chew',
    title: 'How to choose the right chew for your dog',
    summary: 'Rubber, nylon, plush or edible? Match the chew to the chewer and everyone stays happy (and the couch stays intact).',
    image: 'parcels',
    date: 'October 5, 2026',
    body: [
      'Chewing is how dogs explore, relieve boredom and keep their teeth clean. The trick is matching the toy to the way your dog chews.',
      '## Gentle chewers',
      'If your dog carries toys around and naps with them, soft plush toys like a lamb or our Frank the Dapple plush are perfect. Check them now and then for loose seams.',
      '## Average chewers',
      'Rope tugs, rubber treat toys and puzzle toys hold up well and give your dog a job. Stuff a rubber toy with something tasty and freeze it for a longer-lasting challenge.',
      '## Power chewers',
      'Dense nylon chews and tough rubber are made for dogs who go through plush toys in minutes. Replace them once they’re worn down to a size that could be swallowed.',
      '## Edible chews',
      'Bully sticks, yak cheese chews and dental treats are great for occupying a dog and helping with teeth, but they count toward daily calories. Always supervise, and take the last small piece away.',
      '## The thumbnail test',
      'If you can’t make a dent in a chew with your thumbnail, it may be hard enough to crack a tooth. When in doubt, ask your vet what’s safe for your dog.',
    ],
  },
  {
    slug: 'short-coats-canadian-winters',
    title: 'Getting a short-coated dog through a Canadian winter',
    summary: 'Low to the ground and short of coat, dachshunds feel the cold fast. Here’s how to keep winter walks happy.',
    image: 'snow',
    date: 'September 28, 2026',
    body: [
      'A dachshund’s belly sits only a few centimetres above the snow, and most have a short, thin coat. That makes Canadian winters tougher on them than on a husky.',
      '## Layer up',
      'A sweater that covers the full length of the back and the chest keeps in body heat. Most dog sweaters are cut for deeper chests and shorter backs, so look for one made for long dogs. For wet snow and freezing rain, add a waterproof coat on top.',
      '## Protect their paws',
      'Road salt and de-icers sting and can irritate paw pads. Rubber boots keep paws dry and salt-free. If your dog won’t wear boots, wipe their paws with a warm cloth or grooming wipe as soon as you get home.',
      '## Shorter, more frequent walks',
      'On the coldest days, swap one long walk for a few short ones and make up the difference with indoor play: puzzle toys, hide-and-seek with treats and a game of tug.',
      '## A warm spot to come home to',
      'A burrow bed or a self-warming pad away from drafts gives them somewhere cozy to thaw out. Dachshunds will happily tunnel under a blanket, too.',
    ],
  },
];

// Care text depends on what a product is.
function careFor(p) {
  switch (p.category) {
    case 'toys': return 'Check toys regularly and replace them once they’re worn, torn or small enough to swallow. No toy is indestructible, so supervise play, especially with new toys.';
    case 'treats': return 'Feed as a treat alongside a complete and balanced diet, with fresh water always available. Supervise chewing, and take away the last small piece of any chew. Store sealed in a cool, dry place.';
    case 'walk': return 'Check the fit before every walk: you should be able to slide two fingers under any strap. Inspect buckles and stitching regularly and replace worn gear.';
    case 'home': return 'Follow the care label for washing. Wash bowls daily and check beds and blankets for loose threads.';
    case 'apparel': return 'Measure your dog from the base of the neck to the base of the tail, and around the widest part of the chest, before choosing a size. Hand wash or gentle cycle, lay flat to dry.';
    case 'grooming': return 'Use as directed and keep out of your dog’s eyes. Stop if you see redness or irritation and check with your vet.';
    default: return 'Follow the manufacturer’s instructions and supervise your dog when using new gear.';
  }
}

module.exports = { JOURNAL, careFor, brandImage };
