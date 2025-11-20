import {
  AlertCircle,
  Camera,
  CheckCircle,
  Scale,
  Sparkles,
  Upload,
  Utensils,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import "../css/mainpages.css";

export default function MealPlannerApp() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState({
    preferredFoods: "",
    allergies: "",
    weight: "",
    height: "",
    goal: "maintain",
  });
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileChange = (field, value) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  };

  const generateMealPlan = async () => {
    if (!userProfile.preferredFoods || !userProfile.weight) {
      alert("선호 음식과 체중 정보를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const bmi = userProfile.height
        ? (userProfile.weight / (userProfile.height / 100) ** 2).toFixed(1)
        : null;

      const prompt = `다음 정보를 바탕으로 하루 식단을 추천해주세요:
- 선호 음식: ${userProfile.preferredFoods}
- 알레르기: ${userProfile.allergies || "없음"}
- 체중: ${userProfile.weight}kg
${userProfile.height ? `- 신장: ${userProfile.height}cm (BMI: ${bmi})` : ""}
- 목표: ${
        userProfile.goal === "lose"
          ? "체중 감량"
          : userProfile.goal === "gain"
          ? "체중 증가"
          : "체중 유지"
      }

아침, 점심, 저녁 식단을 각각 추천하고, 각 식사의 예상 칼로리와 영양소 정보를 포함해주세요. JSON 형식으로만 응답해주세요:
{
  "breakfast": {"name": "식사명", "calories": 칼로리, "description": "설명"},
  "lunch": {"name": "식사명", "calories": 칼로리, "description": "설명"},
  "dinner": {"name": "식사명", "calories": 칼로리, "description": "설명"},
  "totalCalories": 총칼로리,
  "tips": "건강 팁"
}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=KEY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const cleanText = text.replace(/```json|```/g, "").trim();
      const plan = JSON.parse(cleanText);
      setMealPlan(plan);
      setActiveTab("meal");
    } catch (error) {
      console.error("Error:", error);
      alert("식단 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        setVerificationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyPlate = async () => {
    if (!uploadedImage) {
      alert("이미지를 먼저 업로드해주세요.");
      return;
    }

    setVerifying(true);
    try {
      const base64Data = uploadedImage.split(",")[1];

      const prompt = `이 이미지를 분석하여 다음을 판단해주세요:
1. 잔반 여부 (음식이 남았는지)
2. 사용된 식기 종류와 개수
3. 미사용 식기가 있는지

JSON 형식으로만 응답해주세요:
{
  "cleanPlate": true/false,
  "foodRemaining": "남은 음식 설명",
  "usedDishes": ["사용된 식기 목록"],
  "unusedDishes": ["미사용 식기 목록"],
  "score": 0-100,
  "feedback": "피드백 메시지"
}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=KEY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: { mime_type: "image/jpeg", data: base64Data },
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const cleanText = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(cleanText);
      setVerificationResult(result);
    } catch (error) {
      console.error("Error:", error);
      alert("이미지 분석 중 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  const getTabClassName = (tabName) =>
    `tab-button ${activeTab === tabName ? "active" : ""}`;
  const getResultCardClassName = (isClean) =>
    `result-card ${isClean ? "clean" : "leftover"}`;

  return (
    <div className="meal-planner-app">
      <div className="header">
        <div className="max-w-md-container">
          <div className="header-content">
            <div className="app-icon">
              <Utensils className="text-white" size={20} />
            </div>
            <h1 className="app-title">AI 식단 관리</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md-container pb-24 pt-4">
        {/* 탭 네비 */}
        <div className="tab-nav">
          <button
            onClick={() => setActiveTab("profile")}
            className={getTabClassName("profile")}
          >
            프로필
          </button>
          <button
            onClick={() => setActiveTab("meal")}
            className={getTabClassName("meal")}
          >
            식단
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={getTabClassName("verify")}
          >
            잔반인증
          </button>
        </div>

        {/* 프로필 */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <div className="card">
              <div className="profile-card-header">
                <div className="profile-icon">
                  <Sparkles className="text-white" size={16} />
                </div>
                <h2>내 정보</h2>
              </div>
              <div className="form-input-group">
                <div className="form-field">
                  <label>선호 음식 *</label>
                  <input
                    type="text"
                    placeholder="닭가슴살, 현미, 브로콜리..."
                    value={userProfile.preferredFoods}
                    onChange={(e) =>
                      handleProfileChange("preferredFoods", e.target.value)
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>알레르기 정보</label>
                  <input
                    type="text"
                    placeholder="땅콩, 우유, 갑각류..."
                    value={userProfile.allergies}
                    onChange={(e) =>
                      handleProfileChange("allergies", e.target.value)
                    }
                    className="form-input"
                  />
                </div>
                <div className="grid-2-cols">
                  <div className="form-field">
                    <label>체중 (kg) *</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={userProfile.weight}
                      onChange={(e) =>
                        handleProfileChange("weight", Number(e.target.value))
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>신장 (cm)</label>
                    <input
                      type="number"
                      placeholder="170"
                      value={userProfile.height}
                      onChange={(e) =>
                        handleProfileChange("height", Number(e.target.value))
                      }
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label>목표</label>
                  <select
                    value={userProfile.goal}
                    onChange={(e) =>
                      handleProfileChange("goal", e.target.value)
                    }
                    className="form-select"
                  >
                    <option value="lose">체중 감량 🔥</option>
                    <option value="maintain">체중 유지 ⚖️</option>
                    <option value="gain">체중 증가 💪</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={generateMealPlan}
              disabled={loading}
              className="primary-button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner"></div>식단 생성 중...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={20} />
                  AI 식단 생성하기
                </span>
              )}
            </button>
          </div>
        )}

        {/* 식단 */}
        {activeTab === "meal" && (
          <div className="tab-content">
            {!mealPlan ? (
              <div className="card text-center p-12">
                <div
                  className="upload-icon-container mx-auto mb-4"
                  style={{ backgroundColor: "var(--color-gray-100)" }}
                >
                  <Utensils className="text-gray-400" size={40} />
                </div>
                <p className="text-gray-500 font-medium">
                  프로필을 설정하고
                  <br />
                  식단을 생성해주세요
                </p>
              </div>
            ) : (
              <>
                <div className="meal-summary-card">
                  <div className="flex items-center justify-between mb-3">
                    <h2>오늘의 식단</h2>
                    <Scale size={28} />
                  </div>
                  <div className="meal-total-calories">
                    {mealPlan.totalCalories}{" "}
                    <span className="text-lg font-normal">kcal</span>
                  </div>
                </div>
                {["breakfast", "lunch", "dinner"].map((meal) => (
                  <div key={meal} className="meal-item-card">
                    <div className="meal-item-content">
                      <div className="meal-time-emoji">
                        {meal === "breakfast"
                          ? "🌅"
                          : meal === "lunch"
                          ? "☀️"
                          : "🌙"}
                      </div>
                      <div className="meal-details">
                        <div className="meal-time-label">
                          {meal === "breakfast"
                            ? "아침"
                            : meal === "lunch"
                            ? "점심"
                            : "저녁"}
                        </div>
                        <h3 className="meal-name">{mealPlan[meal].name}</h3>
                        <p className="meal-description">
                          {mealPlan[meal].description}
                        </p>
                        <div className="calorie-tag">
                          <span>{mealPlan[meal].calories} kcal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="tip-box">
                  <div className="tip-content">
                    <AlertCircle
                      className="text-blue-500 mt-1 flex-shrink-0"
                      size={20}
                    />
                    <p>{mealPlan.tips}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 잔반 인증 */}
        {activeTab === "verify" && (
          <div className="tab-content">
            <div className="card">
              <div className="profile-card-header">
                <div className="profile-icon">
                  <Camera className="text-white" size={16} />
                </div>
                <h2>잔반 인증</h2>
              </div>
              <div className="upload-area">
                {uploadedImage ? (
                  <div>
                    <img
                      src={uploadedImage}
                      alt="업로드된 이미지"
                      className="uploaded-image"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="change-image-button"
                    >
                      다른 이미지 선택
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-container">
                      <Upload className="text-gray-400" size={32} />
                    </div>
                    <p className="upload-message">
                      식사 후 빈 그릇 사진을
                      <br />
                      업로드하세요
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="upload-button"
                    >
                      사진 선택하기
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden-input"
                />
              </div>
            </div>
            {uploadedImage && (
              <button
                onClick={verifyPlate}
                disabled={verifying}
                className="primary-button"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="spinner"></div>AI 분석 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Camera size={20} />
                    AI로 잔반 확인하기
                  </span>
                )}
              </button>
            )}
            {verificationResult && (
              <div
                className={getResultCardClassName(
                  verificationResult.cleanPlate
                )}
              >
                <div className="result-header">
                  <div className="result-icon-container">
                    {verificationResult.cleanPlate ? (
                      <CheckCircle className="icon" size={36} />
                    ) : (
                      <XCircle className="icon" size={36} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="result-title">
                      {verificationResult.cleanPlate
                        ? "완식 인증 완료!"
                        : "잔반이 있습니다"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="score-tag">
                        <span>{verificationResult.score}/100점</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="result-details">
                  {verificationResult.foodRemaining && (
                    <div className="result-detail-item">
                      <span>남은 음식:</span>
                      <span>{verificationResult.foodRemaining}</span>
                    </div>
                  )}
                  {verificationResult.usedDishes?.length > 0 && (
                    <div className="result-detail-item">
                      <span>사용 식기:</span>
                      <span>{verificationResult.usedDishes.join(", ")}</span>
                    </div>
                  )}
                  {verificationResult.unusedDishes?.length > 0 && (
                    <div className="result-detail-item">
                      <span>미사용 식기:</span>
                      <span>{verificationResult.unusedDishes.join(", ")}</span>
                    </div>
                  )}
                  <div className="result-feedback">
                    <p>{verificationResult.feedback}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Test></Test>
    </div>
  );
}

function Test(){
    return <div>test</div>
}