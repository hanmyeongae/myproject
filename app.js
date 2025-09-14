let currentScreen = 'main-menu';
let currentQuestion = 0;
let answers = {};
let students = JSON.parse(localStorage.getItem('students') || '[]');

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    if (screenId === 'test-screen') {
        startTest();
    } else if (screenId === 'students-screen') {
        displayStudents();
    } else if (screenId === 'info-screen') {
        displayMBTIInfo();
    }
}

function startTest() {
    currentQuestion = 0;
    answers = {};
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestion >= TEST_QUESTIONS.length) {
        calculateResult();
        return;
    }

    const question = TEST_QUESTIONS[currentQuestion];
    document.getElementById('question-text').textContent = question.text;
    document.getElementById('option-a').textContent = question.options.A;
    document.getElementById('option-b').textContent = question.options.B;

    document.getElementById('question-counter').textContent = `${currentQuestion + 1} / ${TEST_QUESTIONS.length}`;

    const progress = ((currentQuestion + 1) / TEST_QUESTIONS.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
}

function selectAnswer(option) {
    const question = TEST_QUESTIONS[currentQuestion];
    answers[question.dimension] = answers[question.dimension] || [];
    answers[question.dimension][currentQuestion] = option;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    if (option === 'A') {
        document.getElementById('option-a').classList.add('selected');
    } else {
        document.getElementById('option-b').classList.add('selected');
    }

    setTimeout(() => {
        currentQuestion++;
        displayQuestion();
    }, 500);
}

function calculateResult() {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    TEST_QUESTIONS.forEach((question, index) => {
        const dimension = question.dimension;
        const answer = answers[dimension] && answers[dimension][index];

        if (answer === 'A') {
            if (dimension === 'EI') scores.E++;
            else if (dimension === 'SN') scores.S++;
            else if (dimension === 'TF') scores.T++;
            else if (dimension === 'JP') scores.J++;
        } else if (answer === 'B') {
            if (dimension === 'EI') scores.I++;
            else if (dimension === 'SN') scores.N++;
            else if (dimension === 'TF') scores.F++;
            else if (dimension === 'JP') scores.P++;
        }
    });

    let mbtiType = '';
    mbtiType += scores.E > scores.I ? 'E' : 'I';
    mbtiType += scores.S > scores.N ? 'S' : 'N';
    mbtiType += scores.T > scores.F ? 'T' : 'F';
    mbtiType += scores.J > scores.P ? 'J' : 'P';

    displayResult(mbtiType);
}

function displayResult(mbtiType) {
    const personalityInfo = getPersonalityInfo(mbtiType);

    document.getElementById('mbti-result').innerHTML = `
        <h3>${mbtiType}</h3>
        <p>${personalityInfo.name}</p>
        <p style="font-style: italic; margin-top: 10px;">${personalityInfo.description}</p>
    `;

    document.getElementById('personality-info').innerHTML = `
        <h4>🎯 주요 특징</h4>
        <ul>
            ${personalityInfo.characteristics.map(char => `<li>${char}</li>`).join('')}
        </ul>
    `;

    document.getElementById('teaching-tips').innerHTML = `
        <h4>📚 교육 지도 방법</h4>
        <ul>
            ${personalityInfo.teachingTips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
    `;

    window.currentMBTIResult = mbtiType;
    showScreen('result-screen');
}

function saveResult() {
    const studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        alert('학생 이름을 입력해주세요.');
        return;
    }

    if (!window.currentMBTIResult) {
        alert('저장할 결과가 없습니다.');
        return;
    }

    const existingStudentIndex = students.findIndex(student => student.name === studentName);

    if (existingStudentIndex !== -1) {
        if (confirm('이미 등록된 학생입니다. 결과를 업데이트하시겠습니까?')) {
            students[existingStudentIndex].mbti = window.currentMBTIResult;
            students[existingStudentIndex].date = new Date().toLocaleDateString();
        } else {
            return;
        }
    } else {
        const newStudent = {
            name: studentName,
            mbti: window.currentMBTIResult,
            date: new Date().toLocaleDateString()
        };
        students.push(newStudent);
    }

    localStorage.setItem('students', JSON.stringify(students));
    alert('결과가 저장되었습니다!');
    document.getElementById('student-name').value = '';
}

function displayStudents() {
    const studentsList = document.getElementById('students-list');

    if (students.length === 0) {
        studentsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">아직 저장된 학생이 없습니다.</p>';
        return;
    }

    studentsList.innerHTML = students.map((student, index) => {
        const personalityInfo = getPersonalityInfo(student.mbti);
        return `
            <div class="student-item">
                <div class="student-info">
                    <h5>${student.name}</h5>
                    <div class="student-mbti">${student.mbti} - ${personalityInfo.name}</div>
                    <small style="color: #6c757d;">검사일: ${student.date}</small>
                </div>
                <button class="delete-btn" onclick="deleteStudent(${index})">삭제</button>
            </div>
        `;
    }).join('');
}

function searchStudents() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm)
    );

    const studentsList = document.getElementById('students-list');

    if (filteredStudents.length === 0) {
        studentsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">검색 결과가 없습니다.</p>';
        return;
    }

    studentsList.innerHTML = filteredStudents.map((student, index) => {
        const originalIndex = students.findIndex(s => s.name === student.name && s.mbti === student.mbti);
        const personalityInfo = getPersonalityInfo(student.mbti);
        return `
            <div class="student-item">
                <div class="student-info">
                    <h5>${student.name}</h5>
                    <div class="student-mbti">${student.mbti} - ${personalityInfo.name}</div>
                    <small style="color: #6c757d;">검사일: ${student.date}</small>
                </div>
                <button class="delete-btn" onclick="deleteStudent(${originalIndex})">삭제</button>
            </div>
        `;
    }).join('');
}

function deleteStudent(index) {
    if (confirm('정말 삭제하시겠습니까?')) {
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        displayStudents();
    }
}

function displayMBTIInfo() {
    const typeGrid = document.getElementById('type-grid');

    typeGrid.innerHTML = Object.keys(MBTI_TYPES).map(type => {
        const info = MBTI_TYPES[type];
        return `
            <div class="type-card" onclick="showTypeDetail('${type}')">
                <h5>${type}</h5>
                <p>${info.name}</p>
                <small>${info.description}</small>
            </div>
        `;
    }).join('');
}

function showTypeDetail(mbtiType) {
    const personalityInfo = getPersonalityInfo(mbtiType);

    const detailHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="color: #4facfe; font-size: 2.5em; margin-bottom: 10px;">${mbtiType}</h3>
                <p style="font-size: 1.3em; color: #2c3e50; margin-bottom: 5px;">${personalityInfo.name}</p>
                <p style="font-style: italic; color: #6c757d;">${personalityInfo.description}</p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: #2c3e50; margin-bottom: 15px;">🎯 주요 특징</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${personalityInfo.characteristics.map(char => `
                        <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0; color: #28a745; font-weight: bold;">✓</span>
                            ${char}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: #2c3e50; margin-bottom: 15px;">📚 교육 지도 방법</h4>
                <ul style="list-style: none; padding-left: 0;">
                    ${personalityInfo.teachingTips.map(tip => `
                        <li style="margin-bottom: 8px; padding-left: 20px; position: relative;">
                            <span style="position: absolute; left: 0;">💡</span>
                            ${tip}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;

    document.getElementById('type-grid').innerHTML = detailHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    showScreen('main-menu');
});