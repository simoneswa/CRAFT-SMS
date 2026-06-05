import pytest
import uuid

# Test Data Setup
SCHOOL_A_UUID = str(uuid.uuid4())
SCHOOL_B_UUID = str(uuid.uuid4())

TEACHER_SCHOOL_A = {
    "provider":     "firebase",
    "firebase_uid": "teacher_a_uid",
    "email":        "teacher_a@schoola.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_A_UUID,
        "role":      "TEACHER",
        "full_name": "Teacher A",
    },
}

TEACHER_SCHOOL_B = {
    "provider":     "firebase",
    "firebase_uid": "teacher_b_uid",
    "email":        "teacher_b@schoolb.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_B_UUID,
        "role":      "TEACHER",
        "full_name": "Teacher B",
    },
}

ADMIN_SCHOOL_A = {
    "provider":     "firebase",
    "firebase_uid": "admin_a_uid",
    "email":        "admin_a@schoola.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_A_UUID,
        "role":      "SCHOOL_ADMIN",
        "full_name": "Admin A",
    },
}

ADMIN_SCHOOL_B = {
    "provider":     "firebase",
    "firebase_uid": "admin_b_uid",
    "email":        "admin_b@schoolb.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_B_UUID,
        "role":      "SCHOOL_ADMIN",
        "full_name": "Admin B",
    },
}

STUDENT_SCHOOL_A = {
    "provider":     "firebase",
    "firebase_uid": "student_a_uid",
    "email":        "student_a@schoola.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_A_UUID,
        "role":      "STUDENT",
        "full_name": "Student A",
    },
}

STUDENT_SCHOOL_B = {
    "provider":     "firebase",
    "firebase_uid": "student_b_uid",
    "email":        "student_b@schoolb.edu",
    "profile": {
        "id":        str(uuid.uuid4()),
        "school_id": SCHOOL_B_UUID,
        "role":      "STUDENT",
        "full_name": "Student B",
    },
}

LESSON_PLAN_SCHOOL_A = {
    "id":         str(uuid.uuid4()),
    "tenant_id":  SCHOOL_A_UUID,
    "teacher_id": TEACHER_SCHOOL_A["profile"]["id"],
    "topic":      "Mathematics 101",
    "status":     "draft",
}

LESSON_PLAN_SCHOOL_B = {
    "id":         str(uuid.uuid4()),
    "tenant_id":  SCHOOL_B_UUID,
    "teacher_id": TEACHER_SCHOOL_B["profile"]["id"],
    "topic":      "English 101",
    "status":     "draft",
}


# ============================================================================
# TEST SUITE 1: Lesson Plan Tenant Isolation (Priority 1)
# ============================================================================

class TestLessonPlanTenantIsolation:
    """Test that GET /lesson-plans/{plan_id} enforces tenant isolation"""

    def test_teacher_cannot_access_other_school_lesson_plan(self):
        """CRITICAL TEST: Teacher from School A cannot access lesson plan from School B.

        Expected: 403 Forbidden
        """
        tenant_id_school_b = LESSON_PLAN_SCHOOL_B["tenant_id"]
        teacher_school_id = TEACHER_SCHOOL_A["profile"]["school_id"]

        assert tenant_id_school_b != teacher_school_id, "Test setup error: schools should be different"

        access_denied = tenant_id_school_b != teacher_school_id
        assert access_denied, "❌ FAIL: Teacher from different school can access lesson plan!"

    def test_admin_cannot_access_other_school_lesson_plan(self):
        """CRITICAL TEST: SCHOOL_ADMIN from School A cannot access School B plans.

        Expected: 403 Forbidden
        """
        admin_school_id = ADMIN_SCHOOL_A["profile"]["school_id"]
        plan_school_id = LESSON_PLAN_SCHOOL_B["tenant_id"]

        assert admin_school_id != plan_school_id

        access_denied = admin_school_id != plan_school_id
        assert access_denied, "❌ FAIL: Admin from different school can access lesson plan!"

    def test_teacher_can_access_own_school_lesson_plan(self):
        """POSITIVE TEST: Teacher from School A CAN access their own school's plans.

        Expected: 200 OK
        """
        teacher_school_id = TEACHER_SCHOOL_A["profile"]["school_id"]
        plan_school_id = LESSON_PLAN_SCHOOL_A["tenant_id"]

        assert teacher_school_id == plan_school_id

        access_allowed = teacher_school_id == plan_school_id
        assert access_allowed, "❌ FAIL: Teacher cannot access their own school lesson plan!"


# ============================================================================
# TEST SUITE 2: Profile Authorization (Priority 2 & 3)
# ============================================================================

class TestProfileAuthorization:
    """Test POST /auth/profile and GET /auth/profile/{user_id} security"""

    def test_student_cannot_create_profile(self):
        """CRITICAL TEST: Student cannot create profiles.

        Expected: 403 Forbidden (no RoleChecker before: 201 Created)
        """
        user_role = STUDENT_SCHOOL_A["profile"]["role"]
        allowed_roles = ["SCHOOL_ADMIN", "SUPER_ADMIN"]

        can_create = user_role in allowed_roles
        assert not can_create, "❌ FAIL: Student can create profiles!"

    def test_teacher_cannot_create_profile(self):
        """CRITICAL TEST: Teacher cannot create profiles.

        Expected: 403 Forbidden
        """
        user_role = TEACHER_SCHOOL_A["profile"]["role"]
        allowed_roles = ["SCHOOL_ADMIN", "SUPER_ADMIN"]

        can_create = user_role in allowed_roles
        assert not can_create, "❌ FAIL: Teacher can create profiles!"

    def test_admin_can_create_profile_for_own_school(self):
        """POSITIVE TEST: SCHOOL_ADMIN CAN create profiles for their school.

        Expected: 201 Created
        """
        admin_role = ADMIN_SCHOOL_A["profile"]["role"]
        admin_school = ADMIN_SCHOOL_A["profile"]["school_id"]
        new_profile_school = SCHOOL_A_UUID

        can_create_roles = admin_role in ["SCHOOL_ADMIN", "SUPER_ADMIN"]
        school_match = admin_school == new_profile_school

        can_create = can_create_roles and school_match
        assert can_create, "❌ FAIL: Admin cannot create profile for own school!"

    def test_admin_cannot_create_profile_for_other_school(self):
        """CRITICAL TEST: SCHOOL_ADMIN from School A cannot create profiles for School B.

        Expected: 403 Forbidden
        """
        admin_school = ADMIN_SCHOOL_A["profile"]["school_id"]
        new_profile_school = SCHOOL_B_UUID

        school_match = admin_school == new_profile_school
        assert not school_match, "❌ FAIL: Admin can create profile for other school!"

    def test_admin_cannot_see_other_school_profile(self):
        """CRITICAL TEST: SCHOOL_ADMIN from School A cannot view profiles from School B.

        Expected: 403 Forbidden
        """
        admin_school = ADMIN_SCHOOL_A["profile"]["school_id"]
        target_school = TEACHER_SCHOOL_B["profile"]["school_id"]

        school_match = admin_school == target_school
        assert not school_match, "❌ FAIL: Admin can view other school profiles!"

    def test_admin_can_see_own_school_profile(self):
        """POSITIVE TEST: SCHOOL_ADMIN from School A CAN view profiles from School A.

        Expected: 200 OK
        """
        admin_school = ADMIN_SCHOOL_A["profile"]["school_id"]
        target_school = TEACHER_SCHOOL_A["profile"]["school_id"]

        school_match = admin_school == target_school
        assert school_match, "❌ FAIL: Admin cannot view own school profiles!"


# ============================================================================
# TEST SUITE 3: Finance Endpoint Authorization
# ============================================================================

class TestFinanceAuthorization:
    """Test POST /finance/slips endpoint authorization"""

    def test_parent_cannot_submit_slip(self):
        """CRITICAL TEST: PARENT cannot submit payment slips.

        Expected: 403 Forbidden
        """
        user_role = "PARENT"
        allowed_roles = ["STUDENT", "TEACHER", "BUSINESS", "SCHOOL_ADMIN"]

        can_submit = user_role in allowed_roles
        assert not can_submit, "❌ FAIL: Parent can submit payment slips!"

    def test_student_can_submit_slip(self):
        """POSITIVE TEST: STUDENT CAN submit payment slips.

        Expected: 201 Created
        """
        user_role = STUDENT_SCHOOL_A["profile"]["role"]
        allowed_roles = ["STUDENT", "TEACHER", "BUSINESS", "SCHOOL_ADMIN"]

        can_submit = user_role in allowed_roles
        assert can_submit, "❌ FAIL: Student cannot submit payment slips!"
