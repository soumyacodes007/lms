import { and, courseNewsfeed, db, eq, groupmember } from '@db/drizzle';

interface SeedReactCourseNewsfeedArgs {
  reactCourseId: string;
  reactGroupId: string;
  adminProfileId: string;
}

const REACT_WELCOME_POST_ID = '7e000001-a000-4000-8000-000000000001';

/** Adds one pinned announcement so the learner news-feed demo has a useful first post. */
export async function seedReactCourseNewsfeed({
  reactCourseId,
  reactGroupId,
  adminProfileId
}: SeedReactCourseNewsfeedArgs): Promise<void> {
  const [adminMember] = await db
    .select({ id: groupmember.id })
    .from(groupmember)
    .where(and(eq(groupmember.groupId, reactGroupId), eq(groupmember.profileId, adminProfileId)))
    .limit(1);

  if (!adminMember) {
    console.log('   ⚠ React admin groupmember is missing, skipping newsfeed post');
    return;
  }

  const [existingPost] = await db
    .select({ id: courseNewsfeed.id })
    .from(courseNewsfeed)
    .where(eq(courseNewsfeed.id, REACT_WELCOME_POST_ID))
    .limit(1);

  if (existingPost) {
    console.log('   ✓ React course welcome post already exists, skipping');
    return;
  }

  await db.insert(courseNewsfeed).values({
    id: REACT_WELCOME_POST_ID,
    courseId: reactCourseId,
    authorId: adminMember.id,
    isPinned: true,
    content:
      '<p><strong>Welcome to Modern Web Development with React!</strong></p><p>Start with the Introduction lesson, then continue through Components and Props. The course examples are ready in the lesson content, and your progress will be tracked as you complete each activity.</p>'
  });

  console.log('   ✓ Inserted React course admin welcome post');
}
