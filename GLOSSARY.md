# Senior Citizen Beneficiary Verification System (SCBVS)

OSCA staff use this system to register senior citizen beneficiaries, verify them by face, and release assistance only when they are eligible. Source: `prisma/schema.prisma`, `src/lib/`, and `README.md`.

## People and roles

**Beneficiary**:
A registered senior citizen who can receive assistance. Records are deactivated, never deleted.
_Avoid_: senior, member, client, claimant

**OSCA ID number**:
The beneficiary's Office of Senior Citizens Affairs ID number. It is unique per beneficiary.
_Avoid_: senior citizen ID, ID number (used alone)

**Reference number**:
The unique number the system gives each beneficiary record.
_Avoid_: beneficiary ID, record number

**Staff**:
The role that registers beneficiaries, checks eligibility, and releases assistance.
_Avoid_: user, encoder, releasing officer

**Administrator**:
The role (`ADMIN` in code) that can do everything staff can, plus manage accounts, edit or deactivate beneficiary records, update face data, and view reports.
_Avoid_: admin user, superuser

**Representative**:
A person who claims assistance on behalf of a beneficiary who cannot come in person.
_Avoid_: proxy, authorized person

## Assistance

**Program**:
A type of assistance, such as Pension, Medical, Grocery, or Burial, with its own restricted period.
_Avoid_: service, benefit, category

**Restricted period**:
The number of calendar days, counted in Manila time, before a beneficiary can claim from the same program again.
_Avoid_: cooldown, waiting period

**Eligibility**:
Whether a beneficiary can claim from a program today. The program must be active, the beneficiary active, and the restricted period over.
_Avoid_: qualification, validation

**Assistance claim**:
The record of one release of assistance to a beneficiary under one program.
_Avoid_: payout, transaction, release (that is the action)

**Release**:
The act of handing over a claim's cash or items. The releasing staff member is recorded.
_Avoid_: disbursement, distribution

## Verification

**Verification method**:
How a claim's identity check was done: Face, Manual ID, or Representative.
_Avoid_: check type, auth method

**Face data**:
A beneficiary's stored face embedding and consent date. Never a photo.
_Avoid_: face photo, biometrics, face image

**Embedding**:
The list of numbers that describes a face, used to compare two faces.
_Avoid_: face vector, template

**Face threshold**:
The similarity score a face must reach to count as a match (`FACE_MATCH_THRESHOLD`). It is set by testing.
_Avoid_: confidence, match rate

**Liveness check**:
The check that the camera sees a real, live face and not a photo or screen.
_Avoid_: anti-spoof (it is one part of it), face detection

**Needs manual verification**:
A flag on a beneficiary who was registered without face data, so staff check an ID instead.
_Avoid_: no face, face exempt

## Records

**Audit log**:
The record of every change, with the user, action, record, and reason.
_Avoid_: history, activity log

**T-NN**:
A test case in the test checklist, for example T09. Results are in `docs/test-results.md`.
_Avoid_: test number
