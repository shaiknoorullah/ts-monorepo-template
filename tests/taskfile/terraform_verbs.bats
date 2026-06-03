#!/usr/bin/env bats

@test "task --list includes terraform:fmt" {
  run task --list-all
  [ "$status" -eq 0 ]
  [[ "$output" == *"terraform:fmt"* ]]
}

@test "task --list includes terraform:validate" {
  run task --list-all
  [[ "$output" == *"terraform:validate"* ]]
}

@test "task --list includes terraform:plan" {
  run task --list-all
  [[ "$output" == *"terraform:plan"* ]]
}

@test "task --list includes terraform:apply" {
  run task --list-all
  [[ "$output" == *"terraform:apply"* ]]
}

@test "task terraform:fmt runs against modules and envs" {
  run task terraform:fmt -- -check
  [ "$status" -eq 0 ]
}
