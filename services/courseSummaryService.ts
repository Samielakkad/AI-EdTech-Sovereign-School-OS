import * as studentDataService from './studentDataService.ts';
import * as archiveService from './archiveService.ts';

const SUMMARIES_KEY = 'courseSummaries';

export interface CourseSummary {
  id: string;
  timestamp: string;
  topic: string;
  transcription: string;
  summary: string;
  teacherName: string;
}

const initializeSummaries = (): void => {
    const existing = localStorage.getItem(SUMMARIES_KEY);
    if (!existing || JSON.parse(existing).length === 0) {
        const now = Date.now();
        const teacherName = studentDataService.getTeachers()[0]?.name || 'Ms. Peterson';
        const initialSummaries: CourseSummary[] = [
            {
                id: `summary-${now - 86400000 * 3}`,
                timestamp: new Date(now - 86400000 * 3).toISOString(),
                topic: 'The Water Cycle',
                transcription: `Alright class, let's talk about the journey of water. It's called the water cycle, and it's happening all the time. First, the sun shines on lakes, rivers, and oceans, and it heats up the water. This turns the water into a gas called water vapor, which rises into the air. This is called evaporation. As the water vapor goes higher, it gets cold and turns back into tiny liquid water droplets, forming clouds. That's condensation. When the clouds get too full of water, it falls back to Earth as rain, snow, sleet, or hail. We call this precipitation. The water then collects in rivers and lakes, and the whole cycle starts over again. Evaporation, condensation, precipitation. Got it?`,
                summary: 'The water cycle describes how water moves on Earth. The sun causes evaporation, turning water into vapor. The vapor cools and forms clouds through condensation. When clouds are full, water falls back to Earth as precipitation (rain, snow). This water collects and the cycle repeats.',
                teacherName,
            },
            {
                id: `summary-${now - 86400000 * 7}`,
                timestamp: new Date(now - 86400000 * 7).toISOString(),
                topic: 'Introduction to Ancient Rome',
                transcription: `Today, we begin our journey into Ancient Rome. The city of Rome was founded on the Tiber River in Italy. For a long time, it was a Republic, which means people elected officials to govern them. The most powerful group was the Senate. This period saw Rome expand its territory greatly. A very famous Roman was Julius Caesar, a general who became very powerful, which eventually led to the end of the Republic. After him, his adopted son Augustus became the first Roman Emperor, starting the Roman Empire. The Empire was a time of great power, but also great change. We'll be looking at the aqueducts, the Colosseum, and the daily lives of Romans.`,
                summary: 'Ancient Rome began as a Republic governed by elected officials and the Senate. It expanded its territory significantly during this time. The rise of powerful generals like Julius Caesar led to the transition to an Empire, with Augustus as the first emperor. This era is known for major engineering feats and cultural developments.',
                teacherName,
            },
            {
                id: `summary-${now - 86400000 * 14}`,
                timestamp: new Date(now - 86400000 * 14).toISOString(),
                topic: 'Photosynthesis',
                transcription: `So how do plants eat? They don't have mouths! They make their own food using a process called photosynthesis. It's like a recipe. The ingredients are sunlight, water, and a gas from the air called carbon dioxide. The plant's leaves have a special green pigment called chlorophyll, which is amazing at capturing energy from the sun. The plant uses this energy to turn the water and carbon dioxide into a type of sugar, which is its food. As a byproduct, a very important one for us, it releases oxygen into the air. So, plants clean our air and make their own food at the same time. Pretty cool, right?`,
                summary: 'Photosynthesis is the process plants use to create their own food. They use three main ingredients: sunlight, water, and carbon dioxide. The green pigment in leaves, chlorophyll, captures sunlight. The plant then uses this energy to convert the water and carbon dioxide into sugar (food) and releases oxygen as a byproduct.',
                teacherName,
            },
            {
                id: `summary-${now - 86400000 * 21}`,
                timestamp: new Date(now - 86400000 * 21).toISOString(),
                topic: 'Our Solar System',
                transcription: `Let's take a tour of our solar system! At the center of it all is our star, the Sun. It's huge and hot. The closest planet is Mercury, then Venus, then our home, Earth, and then Mars, the 'Red Planet'. These are the rocky planets. After Mars, there's a big asteroid belt. Beyond that are the gas giants: Jupiter, which is the biggest, and Saturn, famous for its beautiful rings. Then we have the ice giants, Uranus and Neptune, which are very cold and far away. So that's Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.`,
                summary: 'Our solar system is centered around the Sun. The planets, in order, are Mercury, Venus, Earth, Mars (the rocky planets), followed by Jupiter, Saturn (the gas giants), and then Uranus and Neptune (the ice giants). Each planet has unique characteristics, from Mars\' red color to Saturn\'s rings.',
                teacherName,
            },
            {
                id: `summary-${now - 86400000 * 30}`,
                timestamp: new Date(now - 86400000 * 30).toISOString(),
                topic: 'Basics of Fractions',
                transcription: `Fractions are all about parts of a whole. Imagine a pizza. If you cut it into 8 slices and eat one, you've eaten 1/8 of the pizza. The number on the bottom, the denominator, tells you how many equal parts the whole is divided into. The number on top, the numerator, tells you how many of those parts you have. So in 1/8, 8 is the denominator and 1 is the numerator. Sometimes fractions can look different but be the same amount. 1/2 is the same as 2/4. These are called equivalent fractions.`,
                summary: 'A fraction represents a part of a whole. The bottom number, the denominator, shows the total number of equal parts. The top number, the numerator, shows how many parts are being considered. Fractions that represent the same amount but have different numbers (like 1/2 and 2/4) are called equivalent fractions.',
                teacherName,
            },
            {
                id: `summary-${now - 86400000 * 35}`,
                timestamp: new Date(now - 86400000 * 35).toISOString(),
                topic: 'Literary Devices',
                transcription: `When we read stories and poems, authors use special tools to make their writing more interesting. These are called literary devices. A common one is a simile, which compares two things using the words 'like' or 'as'. For example, 'The sun was like a giant orange.' Another is a metaphor, which makes a direct comparison by saying one thing *is* another. 'The sun was a giant orange.' See the difference? No 'like' or 'as'. Finally, personification is when we give human qualities to things that aren't human. 'The wind whispered through the trees.' Wind can't whisper, but it helps us imagine the sound.`,
                summary: 'Literary devices are tools authors use to make writing more descriptive. Key examples include: \n- **Simile**: A comparison using "like" or "as" (e.g., "fast as a cheetah").\n- **Metaphor**: A direct comparison stating one thing *is* another (e.g., "he is a cheetah on the track").\n- **Personification**: Giving human qualities to non-human things (e.g., "the angry storm").',
                teacherName,
            },
        ];
        localStorage.setItem(SUMMARIES_KEY, JSON.stringify(initialSummaries));
    }
};

initializeSummaries();

export const getSummaries = (): CourseSummary[] => {
    try {
        const summariesJson = localStorage.getItem(SUMMARIES_KEY);
        const summaries: CourseSummary[] = summariesJson ? JSON.parse(summariesJson) : [];
        return summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse course summaries from localStorage", error);
        return [];
    }
};

const saveSummaries = (summaries: CourseSummary[]): void => {
    localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
};

export const addSummary = (data: Omit<CourseSummary, 'id' | 'timestamp' | 'teacherName'>): CourseSummary => {
    const summaries = getSummaries();
    const teacher = studentDataService.getTeachers()[0];
    const newSummary: CourseSummary = {
        ...data,
        id: `summary-${Date.now()}`,
        timestamp: new Date().toISOString(),
        teacherName: teacher?.name || 'Teacher',
    };
    summaries.unshift(newSummary); // Add to the top
    saveSummaries(summaries);

    archiveService.addItem({
        type: 'CourseSummary',
        title: `Summary: ${newSummary.topic}`,
        topic: newSummary.topic,
        authorId: teacher?.id,
        content: newSummary,
    });

    return newSummary;
};