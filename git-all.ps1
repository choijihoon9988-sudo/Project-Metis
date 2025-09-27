# git-all.ps1

# 1. 변경 사항 스테이징
git add .

# 2. 로컬 커밋
# 변경 사항이 없는 경우에도 스크립트 실행은 계속됩니다.
git commit -m "자동 커밋"

# 3. 원격 저장소(GitHub)로 푸시
# 로컬 커밋 내역을 GitHub에 업로드합니다.
git push

# 4. Firebase Hosting 배포 (업로드)
# Git 푸시가 완료된 후, Firebase 프로젝트를 Hosting에 배포합니다.
# 이 명령은 Firebase CLI가 시스템에 설치되어 있고,
# 해당 프로젝트가 'firebase init'을 통해 설정 및 로그인(firebase login)된 상태여야 작동합니다.
firebase deploy