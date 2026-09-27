export type RecruiterApplication = { application: { status: string } };

export function summarizeRecruiterApplications(applications: RecruiterApplication[]) {
  return applications.reduce(
    (summary, row) => {
      summary.total += 1;
      if (row.application.status === 'APPLIED') summary.pending += 1;
      if (row.application.status === 'SHORTLISTED') summary.shortlisted += 1;
      if (row.application.status === 'SELECTED') summary.selected += 1;
      return summary;
    },
    { total: 0, pending: 0, shortlisted: 0, selected: 0 }
  );
}
