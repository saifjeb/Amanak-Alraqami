import {getAdminStudentStatuses,getAdminStudentDetails} from "../Model/adminStudentStatus.Model.js";

const toNumber = (value) => {
  if (value === null || value === undefined)
 {
    return null;
  }

  const number =Number(value);

  return Number.isNaN(number)
    ? value
    : number;
};

const normalizeStudentNumbers = (student) => {if (!student) 
  {
    return student;
  }
  const normalized = {...student,};
  const numericFields = [
    "total_points",
    "total_adventures",
    "started_adventures",
    "completed_adventures",
    "completion_percentage",
    "pre_test_score",
    "post_test_score",
    "improvement",
  ];

  for (const field of numericFields) {
    if (field in normalized)
       {
      normalized[field] = toNumber(normalized[field]);
       }
  }

  return normalized;
};

const isSingleString = (value) => {
  return (value === undefined || typeof value === "string");
};

export const getAdminStudentStatusesController =
  async (req, res, next) => {
    try {
      const {
        search = "",age_group,activity_status,learning_status,account_status,online,page = "1",limit = "10",
      } = req.query;

      const queryValues = [search,age_group,activity_status,learning_status,account_status,online,page,limit,];
      if (
        !queryValues.every(
          isSingleString,
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid query parameters",
        });
      }

      const pageNumber = Number(page);

      const limitNumber =
        Number(limit);

      if (
        !Number.isInteger(
          pageNumber,
        ) ||
        pageNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Page must be a positive integer",
        });
      }

      if (
        !Number.isInteger(
          limitNumber,
        ) ||
        limitNumber < 1 ||
        limitNumber > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Limit must be between 1 and 100",
        });
      }

      const validAgeGroups = [
        "8-10",
        "11-14",
      ];

      const validActivityStatuses = [
        "active",
        "inactive",
        "disabled",
      ];

      const validLearningStatuses = [
        "completed",
        "in_progress",
        "not_started",
      ];

      const validAccountStatuses = [
        "enabled",
        "disabled",
      ];

      if (
        age_group &&
        !validAgeGroups.includes(
          age_group,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid age_group",
        });
      }

      if (
        activity_status &&
        !validActivityStatuses.includes(
          activity_status,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid activity_status",
        });
      }

      if (
        learning_status &&
        !validLearningStatuses.includes(
          learning_status,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid learning_status",
        });
      }

      if (
        account_status &&
        !validAccountStatuses.includes(
          account_status,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid account_status",
        });
      }

      if (
        online !== undefined &&
        online !== "true" &&
        online !== "false"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Online must be true or false",
        });
      }

      const rawStudents =
        await getAdminStudentStatuses();

      const students =
        rawStudents.map(
          normalizeStudentNumbers,
        );

      let filteredStudents = [
        ...students,
      ];

      if (search.trim()) {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        filteredStudents =
          filteredStudents.filter(
            (student) =>
              String(
                student.nickname ||
                  "",
              )
                .toLowerCase()
                .includes(
                  searchValue,
                ),
          );
      }

      if (age_group) {
        filteredStudents =
          filteredStudents.filter(
            (student) =>
              student.age_group ===
              age_group,
          );
      }

      if (activity_status) {
        filteredStudents =
          filteredStudents.filter(
            (student) =>
              student
                .activity_status ===
              activity_status,
          );
      }

      if (learning_status) {
        filteredStudents =
          filteredStudents.filter(
            (student) =>
              student
                .learning_status ===
              learning_status,
          );
      }

      if (account_status) {
        filteredStudents =
          filteredStudents.filter(
            (student) =>
              student
                .account_status ===
              account_status,
          );
      }

      if (
        online !== undefined
      ) {
        const onlineBoolean =
          online === "true";

        filteredStudents =
          filteredStudents.filter(
            (student) =>
              student.is_online ===
              onlineBoolean,
          );
      }

      const summary = {
        total_students:
          filteredStudents.length,

        online:
          filteredStudents.filter(
            (student) =>
              student.is_online ===
              true,
          ).length,

        offline:
          filteredStudents.filter(
            (student) =>
              student.is_online ===
              false,
          ).length,

        active:
          filteredStudents.filter(
            (student) =>
              student
                .activity_status ===
              "active",
          ).length,

        inactive:
          filteredStudents.filter(
            (student) =>
              student
                .activity_status ===
              "inactive",
          ).length,

        disabled:
          filteredStudents.filter(
            (student) =>
              student
                .account_status ===
              "disabled",
          ).length,

        completed:
          filteredStudents.filter(
            (student) =>
              student
                .learning_status ===
              "completed",
          ).length,

        in_progress:
          filteredStudents.filter(
            (student) =>
              student
                .learning_status ===
              "in_progress",
          ).length,

        not_started:
          filteredStudents.filter(
            (student) =>
              student
                .learning_status ===
              "not_started",
          ).length,
      };

      const totalItems =
        filteredStudents.length;

      const totalPages =
        totalItems === 0
          ? 0
          : Math.ceil(
              totalItems /
                limitNumber,
            );

      const startIndex =
        (pageNumber - 1) *
        limitNumber;

      const endIndex =
        startIndex +
        limitNumber;

      const paginatedStudents =
        filteredStudents.slice(
          startIndex,
          endIndex,
        );

      return res.status(200).json({
        success: true,
        summary,

        pagination: {
          page:
            pageNumber,

          limit:
            limitNumber,

          total_items:
            totalItems,

          total_pages:
            totalPages,

          has_previous_page:
            pageNumber > 1,

          has_next_page:
            pageNumber <
            totalPages,
        },

        filters: {
          search:
            search || null,

          age_group:
            age_group || null,

          activity_status:
            activity_status ||
            null,

          learning_status:
            learning_status ||
            null,

          account_status:
            account_status ||
            null,

          online:
            online !== undefined
              ? online === "true"
              : null,
        },

        students:
          paginatedStudents,
      });
    } catch (error) {
      return next(error);
    }
  };

export const getAdminStudentDetailsController =
  async (req, res, next) => {
    try {
      const studentId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          studentId,
        ) ||
        studentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid student ID",
        });
      }

      const rawStudent =
        await getAdminStudentDetails(
          studentId,
        );

      if (!rawStudent) {
        return res.status(404).json({
          success: false,
          message:
            "Student not found",
        });
      }

      const student =
        normalizeStudentNumbers(
          rawStudent,
        );

      if (
        student.assessment
      ) {
        student.assessment = {
          ...student.assessment,

          pre_test_score:
            toNumber(
              student
                .assessment
                .pre_test_score,
            ),

          post_test_score:
            toNumber(
              student
                .assessment
                .post_test_score,
            ),

          improvement:
            toNumber(
              student
                .assessment
                .improvement,
            ),
        };
      }

      if (
        Array.isArray(
          student.progress,
        )
      ) {
        student.progress =
          student.progress.map(
            (progress) => ({
              ...progress,

              score:
                toNumber(
                  progress.score,
                ),

              earned_points:
                toNumber(
                  progress
                    .earned_points,
                ),
            }),
          );
      }

      return res.status(200).json({
        success: true,
        student,
      });
    } catch (error) {
      return next(error);
    }
  };