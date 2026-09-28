import { and, db, eq, lesson, lessonLanguage } from '@db/drizzle';

export interface LessonTemplate {
  mvcCourseId: string;
  reactCourseId: string;
  pandasCourseId: string;
  adminUserId: string;
  mvcSectionId: string;
  reactSectionId: string;
  pandasSectionId: string;
}

const VIDEO_TYPE = 'youtube' as const;

const REACT_LESSON_CONTENT = [
  {
    id: '6f2d8142-0903-425c-8534-f5105b624752',
    slug: 'introduction-to-react-understanding-the-basics',
    note: `<h3>Welcome to React</h3>
<p>React is a JavaScript library for building interactive user interfaces from small, reusable components. In this lesson you will learn how a React application is structured and how the component tree becomes the page a learner sees.</p>
<img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80" alt="Code editor showing a modern React interface" />
<p>Keep the component model in mind as you work through the course: each component owns a small piece of the interface, accepts data through props, and can respond to user interaction.</p>
<h3>Learning goals</h3>
<ul><li>Explain what a React component is.</li><li>Recognize the role of JSX in a React application.</li><li>Describe how a component tree is rendered.</li></ul>`
  },
  {
    id: '0a39ab2f-9451-4a90-902c-3030bf965637',
    slug: 'components-and-props-building-reusable-ui-elements',
    note: `<h3>Components and props</h3>
<p>Components let you split a page into focused, reusable pieces. Props are the read-only inputs that let a parent component pass data into a child component.</p>
<p>For example, a course card can receive a title, image, and completion percentage as props while keeping its layout in one place. This makes the same card useful on a dashboard, a catalogue, and a mobile view.</p>
<h3>Try it yourself</h3>
<pre><code>function Welcome({ name }) {
  return &lt;h2&gt;Welcome, {name}!&lt;/h2&gt;;
}</code></pre>
<p>Change the value passed to <code>name</code> and observe how the rendered text changes without modifying the component itself.</p>`
  },
  {
    id: '80b79665-733b-41bf-9853-34fd8ab50496',
    slug: 'state-and-lifecycle-managing-data-in-react-applications',
    note: `<h3>State and lifecycle</h3>
<p>State stores values that can change while a learner uses an application. When state changes, React renders the affected part of the interface again so the screen stays in sync with the data.</p>
<p>Use state for interactive values such as a selected lesson, a search term, or whether a panel is open. Keep derived values out of state when they can be calculated from existing data.</p>
<h3>Key idea</h3>
<p>Update state through its setter and let React schedule the next render. This keeps updates predictable and makes interactive screens easier to test.</p>`
  }
] as const;

export async function seedLessons({
  mvcCourseId,
  adminUserId,
  reactCourseId,
  pandasCourseId,
  mvcSectionId,
  reactSectionId,
  pandasSectionId
}: LessonTemplate) {
  const existingLessons = await db.select().from(lesson);
  const existingLessonIds = existingLessons.map((l) => l.id);

  const lessonsToInsert = [
    // MVC Course lessons
    {
      id: '5c75f4f1-c222-44a9-a8c6-81773ea33872',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Lesson 1: Introduction to MVC Architecture',
      teacherId: adminUserId,
      videos: [{ link: 'https://youtu.be/pXLWqkA87e4?si=rUHaBMnuFgAMjm2T', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false,
      order: 1
    },
    {
      id: 'a99e65b7-1394-4751-ad8d-a5fb670ccb9e',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Anatomy of MVC Components',
      teacherId: adminUserId,
      videos: [{ link: 'https://youtu.be/4Qfk8MhtZJU?si=VZ7cF-pjvm_RmFMp', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false,
      order: 2
    },
    {
      id: '266b3daa-1eb2-401e-9510-1819952b44b7',
      courseId: mvcCourseId,
      sectionId: mvcSectionId,
      title: 'Building Your First MVC Application',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=EMwu8F0dCXE', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: false,
      order: 3
    },
    // React Course lessons
    {
      id: '6f2d8142-0903-425c-8534-f5105b624752',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'Introduction to React: Understanding the Basics',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 1
    },
    {
      id: '0a39ab2f-9451-4a90-902c-3030bf965637',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'Components and Props: Building Reusable UI Elements',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=H-PkPKF2Tfk', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 2
    },
    {
      id: '80b79665-733b-41bf-9853-34fd8ab50496',
      courseId: reactCourseId,
      sectionId: reactSectionId,
      title: 'State and Lifecycle: Managing Data in React Applications',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=DveeFlWzWzc', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 3
    },
    // Pandas Course lessons
    {
      id: '5e5c8221-4c11-4c40-8664-11743bb79579',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Python Essentials: An Introduction to Data Science',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 1
    },
    {
      id: '829da386-8ccd-4c81-b2fb-b9891102c83c',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Delving into Data Analysis with Pandas',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=T5pRlIbr6gg&vl=en', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 2
    },
    {
      id: '05f03084-3ff1-49e3-aa2a-7a13840cc4b1',
      courseId: pandasCourseId,
      sectionId: pandasSectionId,
      title: 'Data Cleaning and Preprocessing Techniques',
      teacherId: adminUserId,
      videos: [{ link: 'https://www.youtube.com/watch?v=LI7s_lyooO8', type: VIDEO_TYPE, metadata: {} }],
      isUnlocked: true,
      order: 3
    }
  ].filter((l) => !existingLessonIds.includes(l.id));

  if (lessonsToInsert.length > 0) {
    await db.insert(lesson).values(lessonsToInsert);
    console.log(`   ✓ Inserted ${lessonsToInsert.length} lesson(s)`);
  } else {
    console.log('   ✓ Lessons already exist, skipping');
  }

  // Keep the demo React course useful after a seed is run against an existing
  // database. Older rows were created without public slugs, unlocked state, or
  // lesson body content, so update those rows idempotently here as well.
  for (const content of REACT_LESSON_CONTENT) {
    await db
      .update(lesson)
      .set({ slug: content.slug, note: content.note, isUnlocked: true })
      .where(eq(lesson.id, content.id));

    const [existingLanguage] = await db
      .select({ id: lessonLanguage.id })
      .from(lessonLanguage)
      .where(and(eq(lessonLanguage.lessonId, content.id), eq(lessonLanguage.locale, 'en')))
      .limit(1);

    if (existingLanguage) {
      await db.update(lessonLanguage).set({ content: content.note }).where(eq(lessonLanguage.id, existingLanguage.id));
    } else {
      await db.insert(lessonLanguage).values({ lessonId: content.id, locale: 'en', content: content.note });
    }
  }
}
