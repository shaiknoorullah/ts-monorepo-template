use contracts::health::v1 as healthv1;
use contracts::user::v1 as userv1;

#[test]
fn user_struct_round_trips() {
    let u = userv1::User {
        id: "u-1".into(),
        email: "a@b.c".into(),
        display_name: "Test".into(),
        created_at: None,
    };
    assert_eq!(u.id, "u-1");
    assert_eq!(u.email, "a@b.c");
}

#[test]
fn health_serving_enum() {
    assert_eq!(
        healthv1::health_check_response::ServingStatus::Serving as i32,
        1
    );
}
